# P Language State Machine Specifications

This directory contains the formal P language specifications for the ARM SoC simulator state machines.

## About P Language

P is a state machine based programming language for modeling and specifying distributed systems. It was developed by Microsoft Research and is used for formal verification of concurrent systems.

**Key Features:**
- High-level state machine abstractions
- Event-driven communication
- Formal verification capabilities
- Test generation and systematic testing

**Official Repository:** https://github.com/p-org/P

## Current Implementation

The current implementation uses a JavaScript-based state machine pattern that **emulates P concepts**:

1. **State Machines**: Each component (ARM CPU, NOC, Crypto) is a state machine
2. **Events**: Machines communicate via events (similar to P's `send` operation)
3. **States**: Each machine has clearly defined states with entry handlers
4. **Transitions**: State transitions are triggered by events with optional guards

## Files in this Directory

- `ARMCPUMachine.p` - P specification for ARM CPU with TrustZone
- `NOCMachine.p` - P specification for Network on Chip
- `CryptoMachine.p` - P specification for Crypto Block
- `SoCSimulator.p` - Main P specification that composes all machines

## Future Work

To integrate actual P# runtime:

1. **Install P Compiler**:
   ```bash
   dotnet tool install -g P
   ```

2. **Compile P Specifications**:
   ```bash
   pc -proj:SoCSimulator.pproj
   ```

3. **Generate C# State Machines**:
   P compiler generates C# code that can be integrated with .NET

4. **Bridge to Node.js**:
   - Use edge-js or similar to call C# from Node.js
   - Or run P# runtime as a separate service and communicate via IPC/gRPC

5. **Benefits of Real P# Integration**:
   - Formal verification of safety properties
   - Automatic test case generation
   - Systematic exploration of all execution paths
   - Deadlock detection
   - Liveness checking

## References

- [P Language Documentation](https://github.com/p-org/P/wiki)
- [P Tutorial](https://github.com/p-org/P/tree/master/Tutorial)
- [P# (P Sharp)](https://github.com/p-org/PSharp)
- [Microsoft Research - P](https://www.microsoft.com/en-us/research/project/p/)
