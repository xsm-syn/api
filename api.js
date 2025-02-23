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
    if (!proxy || !port) {
        return res.json({ error: "Missing or invalid 'ip' parameter" });
    }

    try {
        const ipinfo = await sendRequest('myip.xsmnet.buzz', '/', true, proxy, port);
        const start = Date.now();
        const myips = await sendRequest('myip.xsmnet.buzz', '/', false);
        const end = Date.now();
        const delay = `${end - start} ms`;
        const ipingfo = JSON.parse(ipinfo);
        const { myip, ...ipinfoh } = ipingfo;
        const srvip = JSON.parse(myips);

        if (myip && myip !== srvip.myip) {
            res.json({
                proxyip: myip !== srvip.myip,
                delay: delay,
                proxy: proxy,
                port: port,                
                ip: myip,
                ...ipinfoh,
            });
        } else {
            res.json({ proxyip: false });
        }
    } catch (error) {
        res.json({
            proxyip: false,
            delay: "0 ms",
            proxy: proxy,
            port: port,
            ip: "proxy",
            colo: "none",
            asn: "0",
            continent: "none",
            flag: "none",
            org: "none",
            countryCode: "none",
            country: "none",
            city: "none",
            region: "none",
            regionCode: "none",
            postalCode: "none",
            timezone: "none",
            latitude: "none",
            longitude: "none",
            httpProtocol: "none",
            tlsVersion: "none"
            //error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
