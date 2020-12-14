pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/** 
 * @title CentralBBookshop
 * @dev Implements blockchain bookstore (for book owners and readers) + IPFS storage
 */
contract CentralBBookshop {
        
    address private admin;
    
    constructor() public{
        admin = msg.sender;
    }
    
    function init(){
        
    }
    
    // MODIFIERS
    
    modifier isAdmin(address caller){
        require(caller == admin, "caller is not admin");
        _;
    }
    
    modifier userExists(address userAddress){
        require(users[userAddress].exists == 1, "user does not exist");
        _;
    }
    
    modifier doesBookExist(bytes32 bookHash){
        require(booksHashes[bookHash] != 0, "book does not exist");
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId].id != 0, "book does not exist");
        _;
    }
    
    modifier isBookOwner(address userAddress, bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId].owner == userAddress, "user does not own this book");
        _;
    }
    
    modifier isBookOwnerOrAdmin(address _address, bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId].owner == _address || admin == _address, "user does not own this book and not admin");
        _;
    }
    
    modifier hasPurchasedBook(bytes32 bookHash, address userAddress){
        require(purchases[bookHash][userAddress].userAdd == userAddress, "user has not purchased book");
        _;
    }
    
    modifier canSellBook(address userAddress){
        require(users[userAddress].seller && users[userAddress].isSellerApproved, "user is not a seller or not yet approved to sell");
        _;
    }
    
    modifier validCommission(uint8 commission){
        require(commission >= 0 && commission <= 100, "commission must be between 0-100");
        _;
    }
    
    modifier sufficientFunds(uint price){
        require(price <= msg.value, "insufficient funds");
        _;
    }
    
    modifier notPurchased(bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId].purchaseCount == 0, "book has been purchased");
        _;
    }
    
    // EVENTS
    
    event userCreated(string message, address userAddress);
    event userRemoved(string message);
    event bookAdded(string message, bytes32 bookHash);
    event priceUpdated(string message, uint price);
    event bookRemoved(string message);
    
    
    // STRUCTS
    
    // user can be a book seller and/or buyer
    // all users can buy by default but need approval to sell
    struct User{
        address userAdd;
        bool seller;  // book owner
        bool isSellerApproved; // book owners approval status
        uint8 exists; // has been registered
    }
    
    struct Book{
        bytes32 bookHash; // book IPFS hash address
        uint id;
        address owner;
        uint price; // price in tokens
        uint purchaseCount; // number of book purchases
        uint8 commission; // percentage 0-100 commission to store
        uint8 exists;
    }
    
    Book[] booksArr;
    
    // the list of books indexed by IPFS hash address
    mapping (bytes32 => uint) private booksHashes;
    
    // the list of participants indexed by address
    mapping (address => User) private users;
    
    // list of all book purchases
    // for each book, there is a collection of buyers (book->buyers)
    mapping (bytes32 => mapping (address => User)) private purchases;
    
    // list of books bought by users [readers]
    mapping (address => bytes32[]) private boughtBooks;
    
    // lists of books owned by users [publishers]
    mapping (address => bytes32[]) private ownedBooks;
    
    /** 
     * @dev Admin adds new book for owner
     * @param _bookOwner Address of book owner
     * @param _bookHash Book reference on IPFS
     * @param _title Book title
     * @param _price Book reference on IPFS
     * @param _commission Percentage commission 0-100 to be shared with store on sales
     */
    function addBook(address _bookOwner, bytes32 _bookHash, string memory _title, uint _price, uint8 _commission) 
        isAdmin(msg.sender) canSellBook(_bookOwner) validCommission(_commission) public {
        uint _bookId = booksHashes[_bookHash];
        require(_bookId == 0, "book already exists");
        
        uint8 purchaseCount = 0;
        uint8 exists = 1;
        uint newBookId = booksArr.length + 1;
        
        booksHashes[_bookHash] = newBookId;
        booksArr.push(Book(_bookHash, newBookId, _bookOwner, _price, purchaseCount, _commission, exists));
        
        emit bookAdded("book successfully added", _bookHash);
    }
    
    /** 
     * @dev Registers new user
     * @param bookOwner Is new user a book owner?
     */
    function addUser(bool bookOwner) public {
        require(users[msg.sender].exists == 0, "user already registered");
        
        bool isSellerApproved = false;
        uint8 exists = 1;
        
        users[msg.sender] = User(msg.sender, bookOwner, isSellerApproved, exists);
        
        emit userCreated("user added successfully", msg.sender);
    }
    
    /** 
     * @dev Unregisters existing user, and remove all owned books
     */
    function removeUser() userExists(msg.sender) public {
        // remove all user's books if seller
        if(users[msg.sender].seller){
             bytes32[] memory booksHashes = ownedBooks[msg.sender];   
             
             for(uint i = 0; i < booksHashes.length; i++){
                 removeBook(booksHashes[i]);
             }
        }
        
        delete users[msg.sender];
        
        emit userRemoved("user removed successfully");
    }
    
    function buyBook() payable userExists(msg.sender) {
        
        //give user token hash(address + bookHash)
    }
    
    /** 
     * @dev Book owner changes price of enlisted book
     * @param bookHash Book's IPFS storage reference
     * @param newPrice New price for book
     */
    function updateBookPrice(bytes32 bookHash, uint newPrice) doesBookExist(bookHash) isBookOwner(msg.sender, bookHash) public{
        Book storage book = books[bookHash];
        book.price = newPrice;
        
        emit priceUpdated("new price updated", book.price);
    }
    
    /** 
     * @dev Book owner or Admin removes book from store
     * @param bookHash Book's IPFS storage reference
     */
    function removeBook(bytes32 bookHash) doesBookExist(bookHash) notPurchased(bookHash) isBookOwnerOrAdmin(msg.sender, bookHash) public{
        delete books[bookHash];
        
        emit bookRemoved("book successfully removed");
    }
    
    /** 
     * @dev Book seller gets all listed/owned books
     * @return _ownedBooks Array of all books owned
     */
    function getOwnedBooks() canSellBook(msg.sender) view public returns(bytes32[] memory _ownedBooks){
        _ownedBooks = ownedBooks[msg.sender];
    }
    
    /** 
     * @dev User requests for book
     * @param bookHash Book IPFS reference
     * @return book Book struct
     */
    function requestBook(bytes32 bookHash) userExists(msg.sender) doesBookExist(bookHash) view public returns(Book memory book){
        book = booksHashes[bookHash];
    }
    
    /** 
     * @dev User fetches available books using filters. Client fetches for 50 at a time
     * @param _minPrice Minimum price filter
     * @param _maxPrice Maximum price filter
     * @return 
     */
    function getAvailableBooks(uint _maxPrice, uint _minPrice, uint8 _count, uint _start) userExists(msg.sender) public returns (bytes32[] _booksHashes){
        require(_count <= 50, "cannot fetch more than 50 books at once");
        
        // get already purchased books for removal
        bytes32[] myPurchasedBooks = getMyPurchasedBooks(msg.sender);
        
        // get books from pool of all books specifying expected count and starting bookID
        bytes32[] allBooks = listBooks(_start, _count);
        
        for(uint i = 0; i < allBooks.length; i++){
            
            for(uint j = 0;)
            if(allBooks[i]){
                
            }
        }
    }
    
    function getMyPurchasedBooks() userExists(msg.sender) public returns(bytes32[] memory _boughtBooks){
        _boughtBooks = boughtBooks[msg.sender];
    }
    
    function getMyPurchasedBooks(address userAddress) userExists(userAddress) public returns(bytes32[] memory _boughtBooks){
        _boughtBooks = boughtBooks[userAddress];
    }
    
    function generateAccessToken(address userAdd, bytes32 bookHash) private
        pure isAdmin(msg.sender) returns(bytes32) {
        bytes32[] memory accessToken = keccak256(userAdd + bookHash);
        return accessToken;
    }
    
    function listBooks(uint _start, uint _count) view private returns(bytes32[] memory _booksHashes) {

        uint maxIters = _count;
        if( (_start + _count) > booksArr.length) {
            maxIters = booksArr.length - _start;
        }

        _booksHashes = new bytes32[](maxIters);

        for(uint i=0;i<maxIters;i++) {
            uint bookId = _start + i;

            _booksHashes[i] = booksArr[bookId].bookHash;
        }
    }
}