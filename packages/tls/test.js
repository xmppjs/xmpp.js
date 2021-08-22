"use strict";

const test = require("ava");
const ConnectionTLS = require("./lib/Connection");
const tls = require("tls");
const { promise } = require("@xmpp/test");

test("socketParameters()", (t) => {
  t.deepEqual(ConnectionTLS.prototype.socketParameters("xmpps://foo"), {
    port: 5223,
    host: "foo",
  });

  t.deepEqual(ConnectionTLS.prototype.socketParameters("xmpps://foo:1234"), {
    port: 1234,
    host: "foo",
  });

  t.deepEqual(
    ConnectionTLS.prototype.socketParameters("xmpp://foo"),
    undefined,
  );

  t.deepEqual(
    ConnectionTLS.prototype.socketParameters("xmpp://foo:1234"),
    undefined,
  );
});

test("rejects expired certificates", async (t) => {
  const options = {
    key: `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDSyWGs4hf07dd5
VS8yPNxAeotrFuMloSD1OpHcbwhPYuDFKO+3WUC4kZnKJlWqkZBCSvLNy73D3gWJ
ZmP5ck2gUdWg4YE/6ATu7mbQWo3BEeakW2jnuYDnFZhJf4Ip2bs7alKer4WUzoxJ
jU9dAEdz3B4qjfZ6ZXc6LSiFxBzHDl/Z0os6qpFrrs3RHskY7xrcZEcAfgClkmsP
M8/oxGTK24Zfo5yrdRtLYNMiYSsX+CoBmcSzld8BAIp4vesBrp2N3Rrjp9x6pFZb
BSdCJysMU5uwcpdZrZrbDEB0tzbP2mtLNv149WSzZtHl4K5pRghQqx7MBh1V9lVd
jyi4zLLVAgMBAAECggEBAJTcKYHZjkeoLHMAqLsW5gkXQhyX5kSt3UOyYE5Hj5vY
3Zn/hgN7Icz27qAnoHo8IJ/gpEaYK2UHB+v4BoSkp5OgF3ltqETEi69dZ/ie6ts9
1B+gep6jkBgiVREa3obFwId+V+i/Vlw33jUXecPZLZzyB8/PwBDCVYgdWi/Vxuj/
wnO839LUikTph4hhnW+2tCrJ4zzdd9gJb+VVye5goeAaXLIVpsY/YKX4upJOJ7tP
lW3PJgeoHeT4EwQVGHCiTAd+8I2EqqvNTCxzY3x5vgd0EHePTuThsM+6n1vFwKp+
5UBYfGJtf8QKfhfac6WrvREvbVc/WmOtysXBtfdHhAECgYEA8Uysoj+pcY56uvMI
tFovYQtgGIxX2VyzuStXwGtdrzNB+SoDlrwcmKoPMSA2WhkBjoynHX41YHnOZDEq
T9+oJSSoxTE4TgDiVnGjkC5v/mV+E760IsuyUGVmy2WJu1BSrMml/hBnDRSZ717s
gGsEDwKPRSh8ooOPzGV/iM7wT9UCgYEA36DThRmUK6pF+cdO2T/064GFk/PPfKOf
xFUS34RVjkRTknYte+6uYIRzE7JCeoY4o9hwj3x/AyYhFf1H8o90rPVZLBVWdeML
TfxbCTmTQ14BIkLSRWIy8ocmbttMzwMgC/2/ofQ1Ryrl/BLlOeEIyGYVcS8ihjRz
bme6PyxPVwECgYACmmQmX+9xBSt3xtVqNKrcLiY8PY9ZDfH2ZmxM7BuXn0Lv8C8X
ujHIx9TgH8vWTvzAT+4hmFH1F3tNg2ZEdFI5DFsxvWUxGjtW2WT9UjLtGKUyi1Ug
Jvhme6GPQiopNiWeLZK32e9yqa07cte0TvM9QjbPdS9bBXZQqyukCy92fQKBgQDM
HDWTkZIs/KAb6C9umTKJ1dE/BlTGFW5Yu7GbM2UHkhOZZaYELQkZ7So/uv90Z5fA
7Gdof6BKFn4yXNhTa156EwIN+3fL56xExOWumM9xuJZeWBEl5QhNVs/cdOs5M0gH
ydYkEwqh52S8294/Isdqacp+YSAo0Czfg2t6B45vAQKBgQClJxXVWfIET5bZ7Mtf
CFHUJ3Yc+nCXrCj5Lev65z/8tbsl8gAHD8I/NatKcZcOLXr4XpDdkkLb3wyGzuc1
aMCv/THk7vEyLtnhHJ+N3OuN5kmPLwL69cWsob5Vtua0vHwxLmDnNSkiT7+XQ2j4
mrEOeSCP5DOqcpHZ8q8kpjd/nQ==
-----END PRIVATE KEY-----`,
    cert: `-----BEGIN CERTIFICATE-----
MIIDjTCCAnWgAwIBAgIUdQelxJbMGT60o3krKrqQ1C5t5UAwDQYJKoZIhvcNAQEL
BQAwVjELMAkGA1UEBhMCVVMxDzANBgNVBAgMBkRlbmlhbDEUMBIGA1UEBwwLU3By
aW5nZmllbGQxDDAKBgNVBAoMA0RpczESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIw
MDEwMjIwMTIxN1oXDTIxMDEwMTIwMTIxN1owVjELMAkGA1UEBhMCVVMxDzANBgNV
BAgMBkRlbmlhbDEUMBIGA1UEBwwLU3ByaW5nZmllbGQxDDAKBgNVBAoMA0RpczES
MBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA0slhrOIX9O3XeVUvMjzcQHqLaxbjJaEg9TqR3G8IT2LgxSjvt1lAuJGZyiZV
qpGQQkryzcu9w94FiWZj+XJNoFHVoOGBP+gE7u5m0FqNwRHmpFto57mA5xWYSX+C
Kdm7O2pSnq+FlM6MSY1PXQBHc9weKo32emV3Oi0ohcQcxw5f2dKLOqqRa67N0R7J
GO8a3GRHAH4ApZJrDzPP6MRkytuGX6Ocq3UbS2DTImErF/gqAZnEs5XfAQCKeL3r
Aa6djd0a46fceqRWWwUnQicrDFObsHKXWa2a2wxAdLc2z9prSzb9ePVks2bR5eCu
aUYIUKsezAYdVfZVXY8ouMyy1QIDAQABo1MwUTAdBgNVHQ4EFgQU2aR0TjlCwgTJ
uDw4Hi055hOydDEwHwYDVR0jBBgwFoAU2aR0TjlCwgTJuDw4Hi055hOydDEwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAQQj4RB7+oSU52Oi0jPKs
B/7f/wuN7KCPmosalazJmhT7BDCeTWkM1FfIKiAGx4LNxlu6Ut/jhESFY2wRptfr
bLFrZr09gtzG57VNOBlSQ3yfxCGCes7dOAG1HhM2qTLY9HsjEu6ygY1BHJoPVBPe
VJbaqufFQEdO4D4J+lRsXs8KqAyNgZrsChqia4lpBPn1DFwAy32hiTw8HZQNqYzQ
LN7+csuY9MGIz7wDy7EYaO7thYxeBF+eoa7leivp/HNPre0v1gmjD+eDJ8ToCOVs
NebQHyTBqa5P7vjSioiWiSRCNOIL4HywMWtN/nZVk0cl8zwlLtMaGt9Tz7ty2OgL
1A==
-----END CERTIFICATE-----`,
  };

  const server = tls.createServer(options);
  server.listen(0);

  await promise(server, "listening");

  const conn = new ConnectionTLS();
  conn.connect(`xmpps://localhost:${server.address().port}`).catch(() => {});

  const error = await promise(conn, "error");
  t.is(error.message, "certificate has expired");

  await conn.close().catch(() => {});
  server.close();
});

test("rejects self signed certificates", async (t) => {
  const options = {
    key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDGMXUuq7NZXEt6
fiSSkfTGuXHdpMbM/Bn4YVwaNrEmW0I8ZpROHQsEPo6AA/Dz5XM6zkXc+HZoxVfg
Va6T91NRrNnwJYan6+InZOcJI50axYu5KrOyi2X5HBqlUW2MrB+y5LgE1/22id/4
pIGXxfTK3GbzE7qzmB/ff+Mn5gIY1QysBayFG4xtpGLVg+kVkxSDLSMOmX/ezdG5
wNfejVMenBzyylKB8NX50E5Hj28jnVk5zyoXptjsb31/rp82YI3YIFxl8OKX4zEC
GmTULCy19b5c/OeqKL+/XnR6db91Iort80F54p0SCApth+yH0eLsssJpzWaEG05/
+bAc8F/rAgMBAAECggEARsuP4jXvALKZO44nnjuIxhuj8tpTMRG0bSbJ8YsryFm8
1TqHK0fwkXmPCWdfAKArgwv/pKkUEuS7OSUiETS9jGVEDCY7bWwzAoNmi7su+Usr
V99LBTIKIOvLENZ/XUp2oD5XBVPqCvRBDt4kdIR/pp8IHzgi7tgeOoXCLJRal2eS
C+h4+QxkRVk7ML9Qywydh+U/FIvnS95FWUqXy9YF5X5Gv9onYF3jDFC4wA3cFPYD
/h5ppYKnGWvmItxAnzqXJaLUZaqSKFHvr3ub6OL3d6XURbAtmDBrbBiB/mA+V75H
IHNwgINtg24jTeimj12yWjFWD/v1JqAIXhKhnkbH4QKBgQDjAXm61tNMDF0K9RFP
nBtIbIfjkTnD0dcyQEteUx1ETpZLEtgxCTdafu9RX0lZwZa4JAhX7kzn1BjPcI90
zhnQ8jyiVOjsaxA09ptX3VaK7qMXbNhXndKNAqfx2Fwi/PtK6nafjKSDE7RC/iPT
R0UBexOx8zxRuqxRXknlDM/PwwKBgQDfgeH/LjDVyJpLR3+NWp1MtMlCRQYFfvWw
6RE0zKi05/3P+Hmm4QN02dLIMJKWN0n1qKLNTpgoeLwqilxM/bUjeHKFrhkWqmgJ
CunadWoLbj//PI4etWvVNg3RfYd2G5amwW4kvNfEUL2xNrOum+cUZ4rPGSI0Z+ty
Hk7BRtgUuQKBgQC2SdIJskbc87SnfuIWzqGuB9Ebcdw0HkaziKO9K/r9hin0QT6w
Kdl0ZyggbOcHF4jDd9PnYGoLY+tEcPwR7QsYGd2M8ahVaSgLj9hwt0GusTDwN6yG
tyqDp5VbhMWAJyxYHW2Cc7sLsv/3KAN2vu1v4fiP1mYir0d+07t9HkumZwKBgQDV
0YNKg/3kBwzUh4nWyKFDCJCg/TdNeq/AlrcHM+MRbf66PpLiutB7sQaczRru6eWv
Ray5jD60OQyKBeNXJD9tt4SXrn4B2PO98trVSw4v8UD4BA5SAm0ug4+kodo9excc
YF/mdWJVRIi0SAiNOkhOlN+OUBUQ3Xm4qpXdANEmwQKBgDOJbGNzV9exj83FSJIA
3vE2ec9mESWNOKsVbGmY6J5dqkE/tU0UZw/jyym2f1C5UKS3HIdTWyq1+EMn94iQ
mfmZ/2a0ypN53Z0JMpfKHUBK0XPrRaaKMqnYV7CBm5Os217bpNp2eojocZW+X/GR
6xMKh//fd6uKBFPCqf4cp2Ct
-----END PRIVATE KEY-----`,
    cert: `-----BEGIN CERTIFICATE-----
MIIDjTCCAnWgAwIBAgIUB6DHC0wV8ht//JFAJGanpRBapKIwDQYJKoZIhvcNAQEL
BQAwVjELMAkGA1UEBhMCWFgxFTATBgNVBAcMDERlZmF1bHQgQ2l0eTEcMBoGA1UE
CgwTRGVmYXVsdCBDb21wYW55IEx0ZDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIx
MDgyMjA5NTU1N1oXDTIyMDgyMjA5NTU1N1owVjELMAkGA1UEBhMCWFgxFTATBgNV
BAcMDERlZmF1bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0ZDES
MBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAxjF1LquzWVxLen4kkpH0xrlx3aTGzPwZ+GFcGjaxJltCPGaUTh0LBD6OgAPw
8+VzOs5F3Ph2aMVX4FWuk/dTUazZ8CWGp+viJ2TnCSOdGsWLuSqzsotl+RwapVFt
jKwfsuS4BNf9tonf+KSBl8X0ytxm8xO6s5gf33/jJ+YCGNUMrAWshRuMbaRi1YPp
FZMUgy0jDpl/3s3RucDX3o1THpwc8spSgfDV+dBOR49vI51ZOc8qF6bY7G99f66f
NmCN2CBcZfDil+MxAhpk1CwstfW+XPznqii/v150enW/dSKK7fNBeeKdEggKbYfs
h9Hi7LLCac1mhBtOf/mwHPBf6wIDAQABo1MwUTAdBgNVHQ4EFgQUVwsfTVjMB0gO
62nwCNGHLmlM8WYwHwYDVR0jBBgwFoAUVwsfTVjMB0gO62nwCNGHLmlM8WYwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAs/o3MhYjPNceA65Yc0mI
DZpSD/Ds0rSoPtnUX4pXwzcpAh7yVlgqhzex+l/bJuq0tBnxUuM0NYc1US26SHCf
4+pPhYgrACqMG5ecMebzgwMP0vnZsqtt22eeO1mzhz9z3hPYJciyMOU00gotZJHS
GM9inlF4SFttfwgopJSAb4rAvI0u5jzhLrEvu5wRmWEc0zHWmcTGF46gzXW+79ti
jlJ03ZMth8cH6wL8BcbuPBTKj4hjaLdtIcQiQ0a6wG/+z/vaS2XiahNJ6pMDlV3m
aUOpdCwFaeFw/eL7rQr8rQqCtOO8BsNJ54tS4qbTwmHNb+UqcZQRq8qIq/b+z3qp
yA==
-----END CERTIFICATE-----`,
  };

  const server = tls.createServer(options);
  server.listen(0);
  await promise(server, "listening");

  const conn = new ConnectionTLS();
  conn.connect(`xmpps://localhost:${server.address().port}`).catch(() => {});

  const error = await promise(conn, "error");
  t.is(error.message, "self signed certificate");

  await conn.close().catch(() => {});
  server.close();
});

test("waits before emitting connect on tls 1.3", async (t) => {
  const key = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDGMXUuq7NZXEt6
fiSSkfTGuXHdpMbM/Bn4YVwaNrEmW0I8ZpROHQsEPo6AA/Dz5XM6zkXc+HZoxVfg
Va6T91NRrNnwJYan6+InZOcJI50axYu5KrOyi2X5HBqlUW2MrB+y5LgE1/22id/4
pIGXxfTK3GbzE7qzmB/ff+Mn5gIY1QysBayFG4xtpGLVg+kVkxSDLSMOmX/ezdG5
wNfejVMenBzyylKB8NX50E5Hj28jnVk5zyoXptjsb31/rp82YI3YIFxl8OKX4zEC
GmTULCy19b5c/OeqKL+/XnR6db91Iort80F54p0SCApth+yH0eLsssJpzWaEG05/
+bAc8F/rAgMBAAECggEARsuP4jXvALKZO44nnjuIxhuj8tpTMRG0bSbJ8YsryFm8
1TqHK0fwkXmPCWdfAKArgwv/pKkUEuS7OSUiETS9jGVEDCY7bWwzAoNmi7su+Usr
V99LBTIKIOvLENZ/XUp2oD5XBVPqCvRBDt4kdIR/pp8IHzgi7tgeOoXCLJRal2eS
C+h4+QxkRVk7ML9Qywydh+U/FIvnS95FWUqXy9YF5X5Gv9onYF3jDFC4wA3cFPYD
/h5ppYKnGWvmItxAnzqXJaLUZaqSKFHvr3ub6OL3d6XURbAtmDBrbBiB/mA+V75H
IHNwgINtg24jTeimj12yWjFWD/v1JqAIXhKhnkbH4QKBgQDjAXm61tNMDF0K9RFP
nBtIbIfjkTnD0dcyQEteUx1ETpZLEtgxCTdafu9RX0lZwZa4JAhX7kzn1BjPcI90
zhnQ8jyiVOjsaxA09ptX3VaK7qMXbNhXndKNAqfx2Fwi/PtK6nafjKSDE7RC/iPT
R0UBexOx8zxRuqxRXknlDM/PwwKBgQDfgeH/LjDVyJpLR3+NWp1MtMlCRQYFfvWw
6RE0zKi05/3P+Hmm4QN02dLIMJKWN0n1qKLNTpgoeLwqilxM/bUjeHKFrhkWqmgJ
CunadWoLbj//PI4etWvVNg3RfYd2G5amwW4kvNfEUL2xNrOum+cUZ4rPGSI0Z+ty
Hk7BRtgUuQKBgQC2SdIJskbc87SnfuIWzqGuB9Ebcdw0HkaziKO9K/r9hin0QT6w
Kdl0ZyggbOcHF4jDd9PnYGoLY+tEcPwR7QsYGd2M8ahVaSgLj9hwt0GusTDwN6yG
tyqDp5VbhMWAJyxYHW2Cc7sLsv/3KAN2vu1v4fiP1mYir0d+07t9HkumZwKBgQDV
0YNKg/3kBwzUh4nWyKFDCJCg/TdNeq/AlrcHM+MRbf66PpLiutB7sQaczRru6eWv
Ray5jD60OQyKBeNXJD9tt4SXrn4B2PO98trVSw4v8UD4BA5SAm0ug4+kodo9excc
YF/mdWJVRIi0SAiNOkhOlN+OUBUQ3Xm4qpXdANEmwQKBgDOJbGNzV9exj83FSJIA
3vE2ec9mESWNOKsVbGmY6J5dqkE/tU0UZw/jyym2f1C5UKS3HIdTWyq1+EMn94iQ
mfmZ/2a0ypN53Z0JMpfKHUBK0XPrRaaKMqnYV7CBm5Os217bpNp2eojocZW+X/GR
6xMKh//fd6uKBFPCqf4cp2Ct
-----END PRIVATE KEY-----`;
  const cert = `-----BEGIN CERTIFICATE-----
MIIDjTCCAnWgAwIBAgIUB6DHC0wV8ht//JFAJGanpRBapKIwDQYJKoZIhvcNAQEL
BQAwVjELMAkGA1UEBhMCWFgxFTATBgNVBAcMDERlZmF1bHQgQ2l0eTEcMBoGA1UE
CgwTRGVmYXVsdCBDb21wYW55IEx0ZDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIx
MDgyMjA5NTU1N1oXDTIyMDgyMjA5NTU1N1owVjELMAkGA1UEBhMCWFgxFTATBgNV
BAcMDERlZmF1bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0ZDES
MBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAxjF1LquzWVxLen4kkpH0xrlx3aTGzPwZ+GFcGjaxJltCPGaUTh0LBD6OgAPw
8+VzOs5F3Ph2aMVX4FWuk/dTUazZ8CWGp+viJ2TnCSOdGsWLuSqzsotl+RwapVFt
jKwfsuS4BNf9tonf+KSBl8X0ytxm8xO6s5gf33/jJ+YCGNUMrAWshRuMbaRi1YPp
FZMUgy0jDpl/3s3RucDX3o1THpwc8spSgfDV+dBOR49vI51ZOc8qF6bY7G99f66f
NmCN2CBcZfDil+MxAhpk1CwstfW+XPznqii/v150enW/dSKK7fNBeeKdEggKbYfs
h9Hi7LLCac1mhBtOf/mwHPBf6wIDAQABo1MwUTAdBgNVHQ4EFgQUVwsfTVjMB0gO
62nwCNGHLmlM8WYwHwYDVR0jBBgwFoAUVwsfTVjMB0gO62nwCNGHLmlM8WYwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAs/o3MhYjPNceA65Yc0mI
DZpSD/Ds0rSoPtnUX4pXwzcpAh7yVlgqhzex+l/bJuq0tBnxUuM0NYc1US26SHCf
4+pPhYgrACqMG5ecMebzgwMP0vnZsqtt22eeO1mzhz9z3hPYJciyMOU00gotZJHS
GM9inlF4SFttfwgopJSAb4rAvI0u5jzhLrEvu5wRmWEc0zHWmcTGF46gzXW+79ti
jlJ03ZMth8cH6wL8BcbuPBTKj4hjaLdtIcQiQ0a6wG/+z/vaS2XiahNJ6pMDlV3m
aUOpdCwFaeFw/eL7rQr8rQqCtOO8BsNJ54tS4qbTwmHNb+UqcZQRq8qIq/b+z3qp
yA==
-----END CERTIFICATE-----`;

  const server = tls.createServer({
    key,
    cert,
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",
  });
  server.listen(0);
  await promise(server, "listening");

  const conn = new ConnectionTLS();
  conn.socketParameters = () => {
    return {
      port: server.address().port,
      host: "localhost",
      rejectUnauthorized: false,
      minVersion: "TLSv1.3",
      maxVersion: "TLSv1.3",
    };
  };

  // Let's trigger connect but not await it
  const promiseConnect = conn.connect(
    `xmpps://localhost:${server.address().port}`,
  );

  // Let's keep track of weither `connect` was emitted on conn.socket
  let connect_emitted_on_conn_socket = false;
  conn.socket.on("connect", () => {
    connect_emitted_on_conn_socket = true;
  });

  await promise(conn.socket.socket, "secureConnect");

  // If connect was emitted immeditaly after secureConnect this would be true
  t.is(connect_emitted_on_conn_socket, false);

  // Now let's wait for connect to resolve
  // and assert the right protocol is used
  await promiseConnect;
  t.is(conn.socket.socket.getProtocol(), "TLSv1.3");

  // If the previous assertion is false and this one is true
  // it means `connect` was triggered asynchronously after secureConnect
  // which is what we want as it delays the sending of the stream header (conn.open)
  t.is(connect_emitted_on_conn_socket, true);

  await conn.close().catch(() => {});
  server.close();
});
