# Simulation protocol

Versioned Worker adapters and command validators around the shared deterministic
`RunController`. Commands may acknowledge or reject intent, but authority and
all simulation mutations remain in `simulator.js`.
