/**
 * ARM CPU State Machine Specification in P Language
 * Models ARM processor with TrustZone security contexts
 */

// Events
event eSecureTransaction: (transaction: Transaction);
event eNonSecureTransaction: (transaction: Transaction);
event eSendTransaction: (transaction: Transaction);
event eTransactionComplete;
event eTransactionDenied;
event eReturnIdle;

// Transaction type
type Transaction = (
    id: string,
    source: string,
    destination: string,
    securityLevel: string,
    operation: string,
    register: string,
    value: string
);

// ARM CPU State Machine
machine ARMCPUMachine {
    var currentTransaction: Transaction;
    var currentSecurityLevel: string;
    var nocMachine: machine;

    start state Idle {
        entry {
            currentSecurityLevel = "none";
            announce eStateUpdate, (component = "ARM_CPU", state = "IDLE");
        }

        on eSecureTransaction do (payload: Transaction) {
            currentTransaction = payload;
            goto SecureMode;
        }

        on eNonSecureTransaction do (payload: Transaction) {
            currentTransaction = payload;
            goto NonSecureMode;
        }
    }

    state SecureMode {
        entry {
            currentSecurityLevel = "secure";
            announce eStateUpdate, (component = "ARM_CPU", state = "SECURE_MODE");
            send nocMachine, eNOCTransaction, currentTransaction;
            goto TransactionPending;
        }
    }

    state NonSecureMode {
        entry {
            currentSecurityLevel = "non-secure";
            announce eStateUpdate, (component = "ARM_CPU", state = "NON_SECURE_MODE");
            send nocMachine, eNOCTransaction, currentTransaction;
            goto TransactionPending;
        }
    }

    state TransactionPending {
        entry {
            announce eStateUpdate, (component = "ARM_CPU", state = "TRANSACTION_PENDING");
        }

        on eTransactionComplete goto Idle;
        on eTransactionDenied goto Idle;
    }
}

/**
 * Safety Specifications:
 *
 * spec SafetyMonitor observes eSecureTransaction, eNonSecureTransaction {
 *     // Property: Non-secure transactions to config registers should be denied
 *     assert !((currentSecurityLevel == "non-secure") &&
 *              (transaction.register.startsWith("CONFIG_")));
 * }
 *
 * spec LivenessMonitor observes eTransactionComplete, eTransactionDenied {
 *     // Property: Every transaction must eventually complete or be denied
 *     hot state WaitingForResult;
 *     cold state TransactionResolved;
 * }
 */
