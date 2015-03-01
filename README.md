Wolfschanze: simple chat with P2P encryption
============================================

This chat provides a simple way of initiating conversation with one or more
friends. Just visit the page and get a `#room_id` suffixed URL and share it
to your friend. All user gets a browser based public key, making conversation
encryption and decryption within the browser. You may further specify who may
not receive(decrypt) your message, or set the rejection of new joined member
as a default, which may enhance the security.

Getting Started
---------------

### Server

To start the server, just use the `./start.sh`. It requires `supervisor`
installed to call NodeJS and run the server in backend.

The server listens on a port specified in `config.json`(create it by yourself):

    { "port": 1800 }

And you may use following configuration on your NGINX server, to forward a path to
the local port 1800:

    upstream socketio {
        server  127.0.0.1:1800;
    }

    server {
        # Your configuration here...
        # ...

        location /socketio-chat {
            # set /socketio-chat proxified to your socketio server.

    		proxy_pass http://socketio;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            rewrite /socketio-chat/(.*) /socket.io/$1 break;
            proxy_redirect off;
    	}
    	location /wolfschanze {
            # server the static files in `client`.
    		alias /PATH/TO/WOLFSCHANZE/client;
    	}
    }

### Client

You may change the `client/client.js`(at round line 30) to set socket IO to
connect your server. If you use above script to configure your server, socket.io
connects your server at a path like: `http(s)://SERVER_DOMAIN/socketio-chat`.
