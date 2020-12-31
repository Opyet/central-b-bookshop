
let BN = web3.utils.BN;
const CentralBBookshop = artifacts.require('CentralBBookshop');
let catchRevert = require("./exceptionsHelpers.js").catchRevert;

contract("CentralBBookshop", function(accounts){
    
    let instance;
    const admin_commission = 10;
    const admin = accounts[0];
    const publisher_1 = accounts[1];
    const publisher_2 = accounts[2];
    const reader_1 = accounts[3];
    const reader_2 = accounts[4];
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var bookOne = {
        IPFShash: "0x077e6a913a751f6cebd283470a0ab47ecff2e3e80c2dc089f031f909cd617df1",
        hash: "",
        title: "The Big Mouth",
        author: "Ether Dev",
        price: 1500,
        commission: 10,
    };

    beforeEach(async () => {
        instance = await CentralBBookshop.new(admin_commission, {from: admin});
        //console.log(instance);
    })

    it("...should add a new book with all details", async () =>{
        // console.log(publisher_1);
        // console.log(admin);
        let addUser = await instance.addUser(true, {from: publisher_1});
        //console.log(addUser);
        
        assert.equal(addUser.logs[0].event, "UserCreated", "user creation emitted right event");
        
        let approveSeller = await instance.approveSeller(publisher_1, {from: admin});
        //console.log(approveSeller);
        assert.equal(approveSeller.logs[0].event, "SellerApproved", "seller approval emitted right event");

        let newBook = await instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, bookOne.commission, {from: publisher_1});
        assert.equal(newBook.logs[0].event, "BookAdded", "new book call emitted right event");
    });

    it("...should revert on operations (like addUser) if contract has been deactivated by circuit breaker", async () => {
        await instance.changeBookshopOpenStatus({from: admin});        
        await catchRevert(instance.addUser(false, {from: reader_1}));
    });

    it("...should revert if a reader (not seller) tries to add a new book", async () => {
        await instance.addUser(false, {from: reader_1});
        await catchRevert(instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, bookOne.commission, {from: reader_1}));
    })

    it("...should revert when seller tries to add new book with a commission less than bookshop minimum", async () => {
        await instance.addUser(true, {from: publisher_1});
        await instance.approveSeller(publisher_1, {from: admin});
        let commission = 5;
        await catchRevert(instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, commission, {from: publisher_1}))
    })

    it("...should revert when duplicate book IPFS hashes is added", async () => {
        await instance.addUser(true, {from: publisher_1});
        await instance.approveSeller(publisher_1, {from: admin});
        await instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, bookOne.commission, {from: publisher_1});
        await catchRevert(instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, bookOne.commission, {from: publisher_1}));
    })

    it("...should charge required fee for book and refund excess", async () => {
        //add seller
        await instance.addUser(true, {from: publisher_1});
        //add reader
        await instance.addUser(false, {from: reader_1});

        await instance.approveSeller(publisher_1, {from: admin});
        let newBook = await instance.addBook(bookOne.IPFShash, bookOne.title, bookOne.author, bookOne.price, bookOne.commission, {from: publisher_1});
        let newBookHash = newBook.logs[0].args.bookHash;
        //console.log(newBook.logs);

        let ownedBooks = await instance.getOwnedBooks({from: publisher_1});
        assert(ownedBooks.length, 1, "publisher owned books count must be 1");

        //initial balances
        let reader_1BalanceBefore = await web3.eth.getBalance(reader_1);
        let adminBalanceBefore = await web3.eth.getBalance(admin);
        let publisher_1BalanceBefore = await web3.eth.getBalance(publisher_1);
        
        let bookBought = await instance.buyBook(newBookHash, {from: reader_1, value: 2500});
        //console.log(bookBought.logs);
        assert(bookBought.logs[0].event, "BookBought", "must emit BookBought after successful purchase");

        
        // final balances
        let publisher_1BalanceAfter = await web3.eth.getBalance(publisher_1);
        let reader_1BalanceAfter = await web3.eth.getBalance(reader_1);
        let adminBalanceAfter = await web3.eth.getBalance(admin);

        let commissionFee = (new BN(bookOne.price).mul(new BN(bookOne.commission * 100))).div(new BN(10000));
        let paymentToSeller = new BN(bookOne.price).sub(new BN(commissionFee));

        //console.log('sent: ', 2500, 'price: ', bookOne.price, 'commission: ', commissionFee, 'sellerPayment: ', paymentToSeller);                

        let purchasedBooks = await instance.getMyPurchasedBooks({from: reader_1});
        assert(purchasedBooks.length, 1, "reader purchased books count must be 1");
        
        assert.equal(new BN(publisher_1BalanceAfter).toString(), 
            new BN(publisher_1BalanceBefore).add(paymentToSeller).toString(),
            "publisher_1's balance should be increased by price of book minus commission");

        assert.equal(new BN(adminBalanceAfter).toString(), 
            new BN(adminBalanceBefore).add(commissionFee).toString(),
            "bookshop's balance should be increased by commission fee of book");

        assert.isBelow(Number(reader_1BalanceAfter), 
            Number(new BN(reader_1BalanceBefore).sub(new BN(bookOne.price))),
            "reader_1's balance should be decreased by price of book and gas cost");


    })

});