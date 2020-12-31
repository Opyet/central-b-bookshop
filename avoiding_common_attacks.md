# SECURITY DECISIONS AND CONSIDERATIONS AGAINST COMMON ATTACKS

## Safety Checklist
* Automated unit tests were written to ensure that contract logic behaves expectedly.
* User inputs were validated at frontend and verified in modifiers before function execution.
* Recursive calls were avoided to prevent recursive attacks.
* State ``variables`` and ``functions`` visibility was optimized so that malicious access is restricted.
* Modifiers where used with ``reverts`` to control and restrict malicious access.

## Code auditing
* MythX was user to audit code security and suggested optimizations were implemented.

## Optimized Gas Usage
* when reader is fetching new books, loops are limited and fetch is done in batches.
* nested loops were avoided and restricted where necessary.

## Re-entracy Attacks
* withdrawal payment design pattern was used to prevent loss of control and/or evading of remaining vital contract operations (by external caller).

## Integer Overflow and Underflow (SWC-101)
* variable types and max-length were carefully chosen
* a library, ``SafeMath.sol`` was used to handle integer overflow and underflow exceptions and errors.

## Denial of Service with Failed Call (SWC-113)
* withdrawal payment design pattern was used in the ``buyBook`` function and ``refundExcess`` modifier ensuring that even if ``transfer()`` call kept reverting, the contract wouldn't lose total control.

## Denial of Service by Block Gas Limit or startGas (SWC-128)
* with optimized and restricted loops, an Out of Gas error and loss of funds was mitigated.