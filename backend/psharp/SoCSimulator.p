/**
 * Main SoC Simulator Composition in P Language
 * Composes all state machines and defines the system behavior
 */

// System-level events
event eSystemStart;
event eSystemStop;
event eSystemReset;
event eStateUpdate: (component: string, state: string);
event eRegisterUpdate: (component: string, register: string, value: string);
event eTransactionResult: (id: string, status: string, reason: string);
event eSecurityViolation: (transactionId: string, source: string, destination: string, reason: string);

/**
 * Main Test Harness / System Composer
 */
machine SoCSimulator {
    var armCPU: machine;
    var noc: machine;
    var crypto: machine;

    start state Init {
        entry {
            // Create all component machines
            armCPU = new ARMCPUMachine();
            noc = new NOCMachine();
            crypto = new CryptoMachine();

            // Set up inter-machine references
            send armCPU, eSetNOC, noc;
            send noc, eSetCrypto, crypto;
            send noc, eSetARMCPU, armCPU;

            goto Running;
        }
    }

    state Running {
        entry {
            print "SoC Simulator Running";
        }

        on eSystemStop goto Stopped;
        on eSystemReset goto Init;
    }

    state Stopped {
        entry {
            print "SoC Simulator Stopped";
        }

        on eSystemStart goto Running;
    }
}

/**
 * Test Scenarios
 */

// Test Case 1: Secure access to config register (should succeed)
test testSecureConfigAccess: {
    var simulator: machine;
    simulator = new SoCSimulator();

    var transaction: Transaction = (
        id = "test-1",
        source = "ARM_CPU",
        destination = "CRYPTO",
        securityLevel = "secure",
        operation = "write",
        register = "CONFIG_REG_0",
        value = "0xDEADBEEF"
    );

    send simulator.armCPU, eSecureTransaction, transaction;

    // Expect SUCCESS
    assert eventually receives eTransactionResult with (status == "SUCCESS");
}

// Test Case 2: Non-secure access to config register (should fail)
test testNonSecureConfigAccess: {
    var simulator: machine;
    simulator = new SoCSimulator();

    var transaction: Transaction = (
        id = "test-2",
        source = "ARM_CPU",
        destination = "CRYPTO",
        securityLevel = "non-secure",
        operation = "write",
        register = "CONFIG_REG_0",
        value = "0xDEADBEEF"
    );

    send simulator.armCPU, eNonSecureTransaction, transaction;

    // Expect DENIED and security violation
    assert eventually receives eSecurityViolation;
    assert eventually receives eTransactionResult with (status == "DENIED");
}

// Test Case 3: Non-secure access to data register (should succeed)
test testNonSecureDataAccess: {
    var simulator: machine;
    simulator = new SoCSimulator();

    var transaction: Transaction = (
        id = "test-3",
        source = "ARM_CPU",
        destination = "CRYPTO",
        securityLevel = "non-secure",
        operation = "write",
        register = "DATA_REG_0",
        value = "0x12345678"
    );

    send simulator.armCPU, eNonSecureTransaction, transaction;

    // Expect SUCCESS
    assert eventually receives eTransactionResult with (status == "SUCCESS");
}

/**
 * Safety Properties
 */

// Global safety monitor
spec GlobalSafetyMonitor observes eSecurityViolation, eTransactionResult {
    // Property 1: No config register should be modified by non-secure transactions
    assert !(nonSecureAccess && configRegisterModified);

    // Property 2: Every denied transaction should have a corresponding security violation
    assert (transactionDenied) => (securityViolationEmitted);
}

/**
 * Liveness Properties
 */

spec LivenessMonitor {
    // Property: System should not deadlock
    hot state WaitingForTransaction;
    cold state TransactionComplete;

    start state WaitingForTransaction {
        on eTransactionResult goto TransactionComplete;
        on eSecurityViolation goto TransactionComplete;
    }

    state TransactionComplete {
        entry {
            goto WaitingForTransaction;
        }
    }
}

/**
 * Compile this specification:
 * pc -proj:SoCSimulator.pproj
 *
 * Run formal verification:
 * p check SoCSimulator.pproj
 *
 * Generate test cases:
 * p test SoCSimulator.pproj
 */
