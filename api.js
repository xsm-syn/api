const express = require('express');
const tls = require('tls');

const app = express().set("json spaces", 2);
const PORT = process.env.PORT || 15787;

const sendRequest = (host, path, useProxy = true, proxy = null, port = 443) => {
    return new Promise((resolve, reject) => {
        const socket = tls.connect({
            host: useProxy ? proxy : host,
            port: useProxy ? port : 443,
            servername: host
        }, () => {
            const request = `GET ${path} HTTP/1.1\r\n` +
                `Host: ${host}\r\n` +
                `User-Agent: Mozilla/5.0\r\n` +
                `Connection: close\r\n\r\n`;
            socket.write(request);
        });

        let responseBody = '';

        socket.on('data', (data) => {
            responseBody += data.toString();
        });

        socket.on('end', () => {
            const body = responseBody.split('\r\n\r\n')[1] || '';
            resolve(body);
        });

        socket.on('error', (error) => {
            reject(error);
        });

        socket.setTimeout(5000, () => {
            reject(new Error('Request timeout'));
            socket.end();
        });
    });
};

app.get('/', (req, res) => {
    res.json({ error: "api check by @after_sweet" });
});

app.get('/check', async (req, res) => {
    const ipPort = req.query.ip;

    if (!ipPort) {
        return res.json({ error: "Missing 'ip' parameter" });
    }

    const [proxy, port = 443] = ipPort.split(':');
    const portNum = parseInt(port, 10);

    if (!proxy || isNaN(portNum) || portNum <= 0 || portNum > 65535) {
        return res.json({ error: "Invalid 'ip' or 'port' parameter" });
    }

    try {
        const start = Date.now();
        const ipinfo = await sendRequest('myip.xsmnet.buzz', '/', true, proxy, portNum);
        const myips = await sendRequest('myip.xsmnet.buzz', '/', false);
        const end = Date.now();
        const delay = `${end - start} ms`;

        let ipingfo, srvip;
        
        try {
            ipingfo = JSON.parse(ipinfo);
        } catch (err) {
            ipingfo = { error: "Invalid JSON response from proxy", details: ipinfo };
        }

        try {
            srvip = JSON.parse(myips);
        } catch (err) {
            srvip = { error: "Invalid JSON response from server", details: myips };
        }

        const { myip, ...ipinfoh } = ipingfo;

        if (myip && myip !== srvip.myip) {
            res.json({
                proxyip: true,
                delay,
                proxy,
                port: portNum,                
                ip: myip,
                ...ipinfoh,
                server_ip: srvip
            });
        } else {
            res.json({
                proxyip: false,
                delay,
                proxy,
                port: portNum,
                server_ip: srvip
            });
        }
    } catch (error) {
        res.json({
            proxyip: false,
            delay: "0 ms",
            proxy,
            port: portNum,
            error: error.message || "Unknown error"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
