import mech from "sasl-scram-sha-1";

export default function saslScramSha1(sasl) {
  sasl.use(mech);
}
