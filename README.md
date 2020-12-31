# central-b-bookshop
(Final Project: Consensys Blockchain Developer Bootcamp)

## Overview
The central blockchain Book shop is to be a secured, piracy shielding platform, consists of book owners (publishers and self-publishing authors) as well as readers.
Book owners can enlist and sell their digital publications.
Readers can browse and purchase eBooks using cryptocurrency.

### Administrator
The eBookshop Admin deploys contract and sets the minimum commission to be gotten from books. Admin also approves book owners (sellers) to add books and collect funds.

### Book Owner
A publisher or an author (who self-published) has a new eBook to sell to global readers without necessarily having
to go through any online bookstore or marketing agent. He is also wary of piracy and wants to ensure that access to the book is controlled.
Publisher downloads dApp, registers an account on the blockchain and waits for admin approval.
If successful, he is able to post a new ebook as well as manage the old ones.
Publisher can see how many purchases and access books.

### Reader
A reader wants to have unrestricted access to quality ebooks and free from piracy ties.
Reader downloads dApp, registers an account on the blockchain, and can search and browse for eBooks by price, category, language etc.
Reader can make payment for eBook and is issues an access token with which purchase and access is verified.

## Operations
KEYS
===========
``A - ADMIN``
``P - PUBLISHER OR BOOK OWNER``
``R - READER``

FLOW
===========
* A - Deploy contract to network with minimum commission (%) over books
* P/R - getUser (verify and/or authenticate user)
* P - addUser (signifies to be a book seller - true)
* R - addUser (signifies not to be a book seller - false)
* A - approveSeller (referencing with publisher's address)
* P - addBook (generate book ID hash)
* P - getOwnedBooks
* R - getAvailableBooks (get new books)
* P - updateBookPrice
* R - buyBook (pay for book and receive an access token)
* R - requestBook (using book ID hash and access token)
* R - getMyPurchasedBooks
* R - getAvailableBooks (get new books excluding already purchased ones)
* P - removeBook
* P/R - removeUser
* A - changeBookshopOpenStatus (activate/deactivate contract via circuit breaker


## How to Setup App

### Smart Contract
* Can be found in contracts folder
``/contracts``

Follow these steps to use smart contract:
* Navigate to root folder
``/central-b-bookshop``
* Install all dependencies
``npm install``
* Compile contracts
``truffle compile``
* Compile and Deploy contracts
``truffle migrate --network develop``
* Compile, deploy contracts and Test
``truffle test``


### Front end
To set up project,
* Navigate to client folder
``cd /client``
* Install all dependencies
``npm install``
* To build the frontend app, run
``npm run build``
* Start the application on local server
``npm start``
* Open web browser and access app on default port
``localhost:3000//``
