import { env } from '../config/env';
import { logger } from './logger';

// Twilio Video Service for eConsultations
export class VideoService {
  private static getTwilioClient() {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      logger.warn('[Video] No Twilio credentials — running in stub mode');
      return null;
    }
    const twilio = require('twilio');
    return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  // Generate a unique room name
  static generateRoomName(tenantId: string, sessionId: string): string {
    return `p1s_${tenantId}_${sessionId}`;
  }

  // Create a video room
  static async createRoom(roomName: string): Promise<{ roomSid: string }> {
    const client = this.getTwilioClient();
    if (!client) {
      logger.info(`[Video] Stub: creating room ${roomName}`);
      return { roomSid: `RM_stub_${Date.now()}` };
    }

    const room = await client.video.v1.rooms.create({
      uniqueName: roomName,
      type: 'group-small', // up to 4 participants
      maxParticipants: 2,
      recordParticipantsOnConnect: false,
      statusCallback: `${env.FRONTEND_URL}/api/webhooks/video`,
    });

    logger.info(`[Video] Room created: ${room.sid}`);
    return { roomSid: room.sid };
  }

  // Generate access token for a participant
  static generateToken(roomName: string, identity: string): string {
    if (!env.TWILIO_API_KEY_SID || !env.TWILIO_API_KEY_SECRET) {
      logger.info(`[Video] Stub: generating token for ${identity} in ${roomName}`);
      return `stub_token_${identity}_${Date.now()}`;
    }

    const twilio = require('twilio');
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_API_KEY_SID,
      env.TWILIO_API_KEY_SECRET,
      { identity, ttl: 3600 }
    );

    token.addGrant(new VideoGrant({ room: roomName }));
    return token.toJwt();
  }

  // End a room
  static async endRoom(roomSid: string): Promise<void> {
    const client = this.getTwilioClient();
    if (!client) {
      logger.info(`[Video] Stub: ending room ${roomSid}`);
      return;
    }

    await client.video.v1.rooms(roomSid).update({ status: 'completed' });
    logger.info(`[Video] Room ${roomSid} ended`);
  }

  // Get room status
  static async getRoomStatus(roomSid: string): Promise<string> {
    const client = this.getTwilioClient();
    if (!client) return 'in-progress';

    const room = await client.video.v1.rooms(roomSid).fetch();
    return room.status;
  }

  // List recordings for a room
  static async getRecordings(roomSid: string): Promise<{ sid: string; url: string; duration: number }[]> {
    const client = this.getTwilioClient();
    if (!client) return [];

    const recordings = await client.video.v1.rooms(roomSid).recordings.list();
    return recordings.map((r: any) => ({
      sid: r.sid,
      url: `https://video.twilio.com/v1/Recordings/${r.sid}/Media`,
      duration: r.duration,
    }));
  }
}
