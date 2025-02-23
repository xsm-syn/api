const express = require('express');
const tls = require('tls');

const app = express();
const PORT = process.env.PORT || 57924;

async function checkIP(ip, port) {
    const sendRequest = (host, path, useProxy = true) => {
        return new Promise((resolve, reject) => {
            const socket = tls.connect({
                host: useProxy ? ip : host,
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

            socket.setTimeout(3500, () => {
                socket.destroy();
                reject(new Error('Request timeout'));
            });
        });
    };

    return new Promise(async (resolve) => {
        if (!ip || !port) {
            return resolve({ error: "missing parameter" });
        }

        try {
            const ipinfo = await sendRequest('myip.xsmnet.buzz', '/', true);
            const ipinfo2 = await sendRequest('myip.xsmnet.buzz', '/', false);

            if (!ipinfo) return resolve({ proxyip: false });

            const ipingfo = JSON.parse(ipinfo.trim());
            const ipingfo2 = JSON.parse(ipinfo2.trim());

            if (ipingfo.myip && ipingfo.myip !== ipingfo2.myip) {
                const { myip, ...ipinfoh } = ipingfo;
                resolve({                    
                    myip: ip,
                    port: port,
                    proxyip: true,
                    ...ipinfoh
                });
            } else {
                resolve({                    
                    myip: ip,
                    port: port
                    proxyip: false,
                });
            }
        } catch (error) {
            resolve({
                error: error.message
                proxyip: false,
                myip: ip,
                port: port
            });
        }
    });
}

app.get('/api', async (req, res) => {
    const { check } = req.query;

    if (!check || !check.includes(':')) {
        return res.status(400).setHeader('Content-Type', 'application/json')
            .send(JSON.stringify({ error: "api check by @after_sweet" }, null, 2));
    }

    const [ip, port] = check.split(':');

    if (!ip || !port || isNaN(port)) {
        return res.status(400).setHeader('Content-Type', 'application/json')
            .send(JSON.stringify({ error: "api check by @after_sweet" }, null, 2));
    }

    const result = await checkIP(ip, parseInt(port, 10));
    
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result, null, 2));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://127.0.0.1:${PORT}/api?check=1.2.3.4:443`);
});