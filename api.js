const express = require('express');
const tls = require('tls');

const app = express().set("json spaces", 2);
const PORT = process.env.PORT || 15787;

app.get('/check', async (req, res) => {
    const ipPort = req.query.ip;
    if (!ipPort) {
        return res.json({ error: "missing parameter" });
    }

    const [proxy, port = 443] = ipPort.split(':');
    if (!proxy) {
        return res.json({ error: "missing parameter" });
    }

    const sendRequest = (host, path, useProxy = true) => {
    };

    try {
        const [ipinfo, myips] = await Promise.all([
            sendRequest('myip.xsmnet.buzz', '/', true),
            sendRequest('myip.xsmnet.buzz', '/', false),
        ]);
        const ipingfo = JSON.parse(ipinfo);
        const { myip, ...ipinfoh } = ipingfo;
        const srvip = JSON.parse(myips);

        if (myip && myip !== srvip.myip) {
            res.json({
                proxyip: myip !== srvip.myip,
                proxy: proxy,
                port: port,
                ip: myip,
                ...ipinfoh,
            });
        } else {
            res.json({ proxyip: false });
        }
    } catch (error) {
        res.json({ error: error.message, proxyip: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
