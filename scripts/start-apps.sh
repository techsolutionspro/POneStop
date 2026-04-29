#!/bin/bash
cd /home/ec2-user/POneStop
pm2 delete all 2>/dev/null
cd /home/ec2-user/POneStop/server
pm2 start node_modules/.bin/tsx --name p1s-api -- src/index.ts
cd /home/ec2-user/POneStop/client
pm2 start node_modules/.bin/next --name p1s-web -- start -p 3000
pm2 save
pm2 list
echo ""
curl -s http://localhost:4000/api/health
echo ""
echo "DONE"
