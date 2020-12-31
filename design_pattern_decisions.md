# Design Pattern Decisions

## CIRCUIT BREAKER
* admin can 'close the bookshop' through the circuit breaker implementation
* some functionalities (e.g. addUser, approveSeller and buyBook)cannot be accessed once circuit breaker is activated.

## EARLY FAILURES WITH MODIFIERS REVERTS
* modifiers were used properly to track failures early
* revert() was effectively used to stop operations early
* for instance, a reader is not allowed to make payment once the ``msg.value`` is not sufficient for the price of the book requested.

## ACCESS RESTRICTION
* most of the contract state variables (booksHashes, users, IPFSHashes, purchaseTokens etc.) are privately accessible to the contract
* certain operations (as shown in the README doc) can only be performed by certain categories of users
* access token was implemented to restrict book access to readers who have made purchases.
* some tasks and requests can only be done by specific addresses. For instance, only a book owner can update the price of his/her book, and only the address of a reader who purchased a book can use the assigned purchase token to request for the book.

## WITHDRAWAL PAYMENT
* this pattern protects against re-entrancy and Denial-of-service attacks
* during book purchase (by reader), external function calls were not made before internal ones.
