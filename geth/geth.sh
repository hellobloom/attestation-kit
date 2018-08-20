#!/bin/bash

if [ -f static-nodes.dev.json ]; then
  cp static-nodes.dev.json /vol/data/geth/
else
  cp static-nodes.json /vol/data/geth/
fi

/usr/bin/geth --shh --syncmode 'light' --cache 1024 --datadir=/vol/data --verbosity 4 --rpc --rpcaddr=0.0.0.0 --rpcport 8545 --ws --wsaddr=0.0.0.0 --wsport=8546 --wsorigins=* 2>> /vol/logs/geth.out.log

