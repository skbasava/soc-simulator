/**
 * Network on Chip (NOC) State Machine Specification in P Language
 * Handles transaction routing and enforces security policies
 */

// Events
event eNOCTransaction: (transaction: Transaction);
event eCheckSecurity;
event eSecurityOK;
event eSecurityDenied: (reason: string);
event eForwardComplete;
event eBlockComplete;

// NOC State Machine
machine NOCMachine {
    var currentTransaction: Transaction;
    var cryptoMachine: machine;
    var armCPUMachine: machine;

    start state Idle {
        entry {
            announce eStateUpdate, (component = "NOC", state = "IDLE");
        }

        on eNOCTransaction do (payload: Transaction) {
            currentTransaction = payload;
            goto Routing;
        }
    }

    state Routing {
        entry {
            announce eStateUpdate, (component = "NOC", state = "ROUTING");
            raise eCheckSecurity;
        }

        on eCheckSecurity goto CheckingSecurity;
    }

    state CheckingSecurity {
        entry {
            announce eStateUpdate, (component = "NOC", state = "CHECKING_SECURITY");

            // Perform security check
            if (checkSecurityPolicy(currentTransaction)) {
                raise eSecurityOK;
            } else {
                raise eSecurityDenied, "Security policy violation";
            }
        }

        on eSecurityOK goto Forwarding;
        on eSecurityDenied goto Blocking with (reason: string) {
            announce eSecurityViolation, (
                transactionId = currentTransaction.id,
                source = currentTransaction.source,
                destination = currentTransaction.destination,
                reason = reason
            );
        };
    }

    state Forwarding {
        entry {
            announce eStateUpdate, (component = "NOC", state = "FORWARDING");
            send cryptoMachine, eCryptoTransaction, currentTransaction;
            raise eForwardComplete;
        }

        on eForwardComplete goto Idle;
    }

    state Blocking {
        entry {
            announce eStateUpdate, (component = "NOC", state = "BLOCKING");

            // Notify ARM CPU that transaction was denied
            send armCPUMachine, eTransactionDenied;

            announce eTransactionResult, (
                id = currentTransaction.id,
                status = "DENIED",
                reason = getSecurityViolationReason(currentTransaction)
            );

            raise eBlockComplete;
        }

        on eBlockComplete goto Idle;
    }

    // Helper function to check security policy
    fun checkSecurityPolicy(txn: Transaction): bool {
        var isConfigRegister: bool;
        var isSecure: bool;

        isConfigRegister = txn.register.startsWith("CONFIG_REG");
        isSecure = (txn.securityLevel == "secure");

        if (isConfigRegister) {
            // Config registers require secure access
            return isSecure;
        }

        // Data registers can be accessed in non-secure mode
        return true;
    }

    fun getSecurityViolationReason(txn: Transaction): string {
        if (txn.register.startsWith("CONFIG_REG") && txn.securityLevel == "non-secure") {
            return format("Security violation: Non-secure access to secure register {0}", txn.register);
        }
        return "Security policy violation";
    }
}

/**
 * Safety Specifications:
 *
 * spec NOCSecurityMonitor observes eSecurityDenied, eForwardComplete {
 *     // Property: Non-secure transactions to config registers must be blocked
 *     assert !(forwarded && !securityCheckPassed);
 * }
 *
 * spec NOCLivenessMonitor {
 *     // Property: NOC must not stay in CheckingSecurity state indefinitely
 *     hot state CheckingSecurity;
 *     cold state Idle;
 * }
 */
