/**
 * Crypto Block State Machine Specification in P Language
 * Models cryptographic hardware with security-aware configuration registers
 */

// Events
event eCryptoTransaction: (transaction: Transaction);
event eUnlockConfig;
event eLockConfig;
event eWriteConfig: (register: string, value: string);
event eProcessData: (transaction: Transaction);
event eComplete;
event eReset;

// Crypto Block State Machine
machine CryptoMachine {
    var currentTransaction: Transaction;
    var registers: map[string, string];

    start state ConfigLocked {
        entry {
            // Initialize registers
            registers["CONFIG_REG_0"] = "0x00000000";
            registers["CONFIG_REG_1"] = "0x00000000";
            registers["DATA_REG_0"] = "0x00000000";

            announce eStateUpdate, (component = "CRYPTO", state = "CONFIG_LOCKED");
        }

        on eCryptoTransaction do (payload: Transaction) {
            currentTransaction = payload;

            if (isConfigRegisterWrite(payload)) {
                goto ConfigUnlocked;
            } else {
                goto Processing;
            }
        }

        on eReset goto ConfigLocked;
    }

    state ConfigUnlocked {
        entry {
            announce eStateUpdate, (component = "CRYPTO", state = "CONFIG_UNLOCKED");

            // Perform the write operation
            if (currentTransaction.operation == "write") {
                writeRegister(currentTransaction.register, currentTransaction.value);
            }

            // Auto-lock after write
            raise eLockConfig;
        }

        on eLockConfig goto ConfigLocked;
        on eReset goto ConfigLocked;
    }

    state Processing {
        entry {
            announce eStateUpdate, (component = "CRYPTO", state = "PROCESSING");

            // Process the transaction
            if (currentTransaction.operation == "write") {
                writeRegister(currentTransaction.register, currentTransaction.value);
            } else if (currentTransaction.operation == "read") {
                readRegister(currentTransaction.register);
            }

            raise eComplete;
        }

        on eComplete goto ConfigLocked;
        on eReset goto ConfigLocked;
    }

    // Helper functions
    fun isConfigRegisterWrite(txn: Transaction): bool {
        return (txn.register.startsWith("CONFIG_REG") && txn.operation == "write");
    }

    fun writeRegister(reg: string, val: string) {
        registers[reg] = val;

        announce eRegisterUpdate, (
            component = "CRYPTO",
            register = reg,
            value = val
        );

        announce eTransactionResult, (
            id = currentTransaction.id,
            status = "SUCCESS",
            reason = format("Successfully wrote {0} to {1}", val, reg)
        );
    }

    fun readRegister(reg: string) {
        var value: string;
        value = registers[reg];

        announce eTransactionResult, (
            id = currentTransaction.id,
            status = "SUCCESS",
            reason = format("Read {0} from {1}", value, reg)
        );
    }
}

/**
 * Safety Specifications:
 *
 * spec CryptoConfigSafety observes eWriteConfig {
 *     // Property: Config registers can only be written in ConfigUnlocked state
 *     assert (state == ConfigUnlocked) => canWriteConfig;
 * }
 *
 * spec CryptoLivenessMonitor {
 *     // Property: Crypto must eventually return to ConfigLocked
 *     hot state Processing, ConfigUnlocked;
 *     cold state ConfigLocked;
 * }
 */
