pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

/** 
 * @title CentralBBookshop
 * @dev Implements blockchain bookstore (for book owners and readers) + IPFS storage
 */
contract CentralBBookshop {
    
    using SafeMath for uint256;
    using SafeMath for uint16;
    
    bool private bookshopIsClosed = false;
    address payable private admin;
    
    constructor(uint8 minimumCommision) public{
        admin = msg.sender;
        BOOKSHOP_MINIMUM_COMMISSION = minimumCommision;
    }
    
    Book[] private booksArr;
    
    uint8 private BOOKSHOP_MINIMUM_COMMISSION;
    
    // the list of books indexed by book hash -> numerical id
    mapping (bytes32 => uint) private booksHashes;
    
    // the list of books indexed by IPFS hash -> book id hash
    mapping (bytes32 => bytes32) private IPFSHashes;
    
    // the list of participants indexed by address
    mapping (address => User) private users;
    
    // list of all book purchase tokens
    // for each book (bookHash), there is a collection of buyers' accessTokens (addr -> accessToken)
    mapping (bytes32 => mapping (address => bytes32)) private purchaseTokens;
    
    // list of books bought by users [readers]
    mapping (address => bytes32[]) private boughtBooks;
    
    // lists of books owned by users [publishers]
    mapping (address => bytes32[]) private ownedBooks;
    
    
    // STRUCTS
    
    // user can be a book seller and/or buyer
    // all users can buy by default but need approval to sell
    struct User{
        address userAddr;
        bool seller;  // book owner
        bool isSellerApproved; // book owners approval status
        uint8 exists; // has been registered
    }
    
    struct Book{
        bytes32 bookHash; // book id hash
        bytes32 IPFShash; // book ipfs reference
        uint id; // (Id - 1) is the position of book in dynamic array
        address payable owner;
        uint256 price; // price in tokens
        uint120 purchaseCount; // number of book purchases
        // percentage 0-100 commission to store
        // 10000th (10% -> 1000) to keep 2dp
        uint16 commission;
        uint8 exists;
        bool isApproved; //approval for sales
    }
    
    
    // EVENTS
    
    event UserCreated(string message, address userAddress, bool isBookOwner);
    event UserRemoved(string message);
    event SellerApproved(string message);
    event BookAdded(string message, bytes32 indexed bookHash, string title, string author);
    event PriceUpdated(string message, uint price);
    event BookRemoved(string message);
    event BookBought(string message, bytes32 indexed bookHash, address indexed buyer, address seller);
    
    
    // MODIFIERS
    
    /** 
     * @dev Checks if caller is Bookshop admin
     * @param userAddress Address of user
     */
    modifier isAdmin(address userAddress){
        require(userAddress == admin, "caller is not admin");
        _;
    }

    /** 
     * @dev Checks if contract circuit breaker hasn't been activated
     */
    modifier bookshopIsOpen(){
        require(bookshopIsClosed == false, "bookshop is closed by admin");
        _;
    }
    
    /** 
     * @dev Checks if user exists in Bookshop record
     * @param userAddress Address of user
     */
    modifier userExists(address userAddress){
        require(users[userAddress].exists == 1, "user does not exist");
        _;
    }

    modifier isUserOrAdmin(address userAddress){
        require(users[userAddress].exists == 1 || userAddress == admin, "address does not belong to user nor admin");
        _;
    }
    
    /** 
     * @dev Checks if book exists
     * @param bookHash Hash reference of book
     */
    modifier doesBookExist(bytes32 bookHash){
        require(booksHashes[bookHash] != 0, "book does not exist");
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId - 1].id != 0, "book does not exist");
        _;
    }
    
    /** 
     * @dev Checks if existing book belongs to specified address
     * @param userAddress Address of user
     * @param bookHash Hash reference of book
     */
    modifier isBookOwner(address userAddress, bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId - 1].owner == userAddress, "user does not own this book");
        _;
    }
    
    /** 
     * @dev Checks if user with specified address is the owner of the specified book or an admin
     * @param userAddress Address of user
     * @param bookHash Hash reference of book
     */
    modifier isBookOwnerOrAdmin(address userAddress, bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId - 1].owner == userAddress || admin == userAddress, "user does not own this book and not admin");
        _;
    }
    
    /** 
     * @dev Checks if user with specified address has purchased the specified book
     * and has access token validated.
     * @param userAddress Address of user
     * @param bookHash Hash reference of book
     */
    modifier hasPurchasedBook(bytes32 bookHash, bytes32 IPFShash, address userAddress){
        require(purchaseTokens[bookHash][userAddress] != "", "user has not purchased book");
        require(generateAccessToken(userAddress, IPFShash) == purchaseTokens[bookHash][userAddress], "access token could not be validated");
        _;
    }
    
    /** 
     * @dev Checks if user with specified address is a seller and approved to sell
     * @param userAddress Address of user
     */
    modifier canSellBook(address userAddress){
        require(users[userAddress].seller && users[userAddress].isSellerApproved, "user is not a seller or not yet approved to sell");
        _;
    }
    
    /** 
     * @dev Checks if commission specified by seller on a book is valid
     * @param commission Commission over book sales (in percentage)
     */
    modifier validCommission(uint8 commission){
        require(commission >= 0 && commission <= 100, "commission must be between 0-100");
        require(commission >= BOOKSHOP_MINIMUM_COMMISSION, "commission set is too low");
        _;
    }
    
    /** 
     * @dev Checks if reader sends sufficient funds to purchase book
     * @param price The book's selling price
     */
    modifier sufficientFunds(uint price){
        require(price <= msg.value, "insufficient funds");
        _;
    }
    
    /** 
     * @dev Refunds buyer with excess money after payment
     * @param price The book's selling price
     */
    modifier returnExcess(uint price) {
        //refund them after pay for book
        _;
        //this is a silent failure if "there is no leftover to refund to buyer"
        if(msg.value > price){ 
            uint amountToRefund = msg.value - price;
            msg.sender.transfer(amountToRefund);
        }        
    }
    
    /** 
     * @dev Checks if book has not been purchased
     * @param bookHash Hash reference of book
     */
    modifier notPurchased(bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId - 1].purchaseCount == 0, "book has been purchased");
        _;
    }
    
    /** 
     * @dev Checks if book has been approved to be sold
     * @param bookHash Hash reference of book
     */
    modifier isBookSaleApproved(bytes32 bookHash){
        uint bookId = booksHashes[bookHash];
        require(booksArr[bookId - 1].isApproved, "book is not approved for sale");
        _;
    }
    
    /** 
     * @dev Toggle contract activeness. (Circuit breaker)
     */
    function changeBookshopOpenStatus() isAdmin(msg.sender) external {
        bookshopIsClosed = !bookshopIsClosed;
    }
    
    /** 
     * @dev Seller adds new book for owner     
     * @param _IPFShash Book reference on IPFS
     * @param _title Book title
     * @param _price Book reference on IPFS
     * @param _commission Percentage commission 0-100 to be shared with store on sales
     */
    function addBook(bytes32 _IPFShash, string memory _title, string memory _author, uint _price, uint8 _commission) 
        userExists(msg.sender) canSellBook(msg.sender) validCommission(_commission) external {

        bytes32 _bookHash = IPFSHashes[_IPFShash];
        uint _bookId = booksHashes[_bookHash];
        require(_bookId == 0, "book already exists");
        
        bool isApproved;
        
        if(_commission >= BOOKSHOP_MINIMUM_COMMISSION){
            isApproved = true;
        }
        
        uint commission = uint16(100).mul(_commission);
        uint newBookId = booksArr.length + 1;
        
        _bookHash = keccak256(abi.encodePacked(newBookId));
        
        // keep hash mappings
        booksHashes[_bookHash] = newBookId;
        IPFSHashes[_IPFShash] = _bookHash;
        ownedBooks[msg.sender].push(_bookHash);
        
        Book memory book;
        book.IPFShash = _IPFShash;
        book.bookHash = _bookHash;
        book.id = newBookId;
        book.owner = msg.sender;
        book.price = _price;
        book.purchaseCount = 0;
        book.commission = uint16(commission);
        book.exists = 1;
        book.isApproved = isApproved;
        
        booksArr.push(book);
        
        emit BookAdded("book successfully added", _bookHash, _title, _author);
    }
    
    /** 
     * @dev Registers new user
     * @param bookOwner Is new user a book owner?
     */
    function addUser(bool bookOwner) bookshopIsOpen external {
        require(users[msg.sender].exists == 0, "user already registered");
        
        bool isSellerApproved = false;
        uint8 exists = 1;
        
        users[msg.sender] = User(msg.sender, bookOwner, isSellerApproved, exists);
        
        emit UserCreated("user added successfully", msg.sender, bookOwner);
    }
    
    
    /** 
     * @dev Unregisters existing user, and remove all owned books
     */
    function removeUser() userExists(msg.sender) external {
        // remove all user's books if seller
        if(users[msg.sender].seller){
             bytes32[] memory hashes = ownedBooks[msg.sender];   
             
             for(uint i = 0; i < hashes.length; i++){
                 removeBook(hashes[i]);
             }
             delete ownedBooks[msg.sender];
        }
        
        delete users[msg.sender];
        
        emit UserRemoved("user removed successfully");
    }
    
    
    /** 
     * @dev Admin approves seller to be able to list books and receive payments
     * @notice can only be done while contract is active via circuit breaker
     * @param userAddress address of the seller to be approved
     */
    function approveSeller(address userAddress) bookshopIsOpen isAdmin(msg.sender) userExists(userAddress) external {
        if(users[userAddress].seller){
            User storage user = users[userAddress];
            user.isSellerApproved = true;
            emit SellerApproved("seller approved successfully");
        }
        else{
            revert("user is not a seller");
        }
    }
    
    /** 
     * @dev Reader pays for book access
     * @notice can only be done while contract is active via circuit breaker
     * @param bookHash Book IPFS reference
     */
    function buyBook(bytes32 bookHash) bookshopIsOpen userExists(msg.sender) doesBookExist(bookHash) sufficientFunds(booksArr[booksHashes[bookHash] - 1].price) 
    returnExcess(booksArr[booksHashes[bookHash] - 1].price) payable external {
        
        //give user token hash(address + bookHash)
        uint bookId = booksHashes[bookHash];
        Book memory book = booksArr[bookId - 1];
        
        address payable seller = book.owner;
        
        uint commissionFunds = book.price.mul(book.commission).div(10000);
        uint paymentToSeller = book.price.sub(commissionFunds);
        
        // Generate access token for user
        bytes32 accessToken = generateAccessToken(msg.sender, book.IPFShash);
        // store access token
        purchaseTokens[bookHash][msg.sender] = accessToken;
        // keep book purchase
        boughtBooks[msg.sender].push(bookHash);

        seller.transfer(paymentToSeller);
        admin.transfer(commissionFunds);        
        
        emit BookBought("book bought", bookHash, msg.sender, seller);
    }
    
    /** 
     * @dev Book owner changes price of enlisted book
     * @param bookHash Book's IPFS storage reference
     * @param newPrice New price for book
     */
    function updateBookPrice(bytes32 bookHash, uint newPrice) doesBookExist(bookHash) isBookOwner(msg.sender, bookHash) external {
        uint bookId = booksHashes[bookHash];
        Book storage book = booksArr[bookId - 1];
        book.price = newPrice;
        
        emit PriceUpdated("new price updated", book.price);
    }
    
    /** 
     * @dev Book owner or Admin removes book from store
     * @param bookHash Book's IPFS storage reference
     */
    function removeBook(bytes32 bookHash) doesBookExist(bookHash) notPurchased(bookHash) isBookOwnerOrAdmin(msg.sender, bookHash) public{
        Book memory book = booksArr[booksHashes[bookHash] - 1];
        delete ownedBooks[book.owner];
        delete booksArr[booksHashes[bookHash] - 1];
        delete booksHashes[bookHash];
        delete IPFSHashes[bookHash];
        
        emit BookRemoved("book successfully removed");
    }
    
    /** 
     * @dev Book seller gets all listed/owned books
     * @return _ownedBooks Array of all books owned
     */
    function getOwnedBooks() canSellBook(msg.sender) userExists(msg.sender) view external returns(bytes32[] memory _ownedBooks){
        _ownedBooks = ownedBooks[msg.sender];
        for(uint i=0; i < _ownedBooks.length; i++){
            // exclude the leftover hashes in state array map ownedBooks
            if(booksHashes[_ownedBooks[i]] == 0){
                delete _ownedBooks[i];
            }
        }
    }
    
    /**
     * @dev Verify/Authenticate existing user 
     */
    function getUser() isUserOrAdmin(msg.sender) view external returns(bool _authStatus, bool _isSeller, bool _isAdmin){
        _authStatus = true;
        _isSeller = users[msg.sender].seller;
        if(msg.sender == admin) _isAdmin = true;
    }
    
    /** 
     * @dev User requests for book
     * @param _bookHash Book IPFS reference
     * @return bookHash Book hash
     * @return IPFShash IPFS reference to book
     * @return owner Address of Book owner
     * @return price Current selling price of book
     */
    function requestBook(bytes32 _bookHash) userExists(msg.sender) 
    hasPurchasedBook(_bookHash, booksArr[booksHashes[_bookHash] - 1].IPFShash, msg.sender) doesBookExist(_bookHash) view external returns(
        bytes32 bookHash,
        bytes32 IPFShash,
        address owner,
        uint price){
            
       uint bookId = booksHashes[_bookHash];
       price = booksArr[bookId - 1].price;
       owner = booksArr[bookId - 1].owner;
       IPFShash = booksArr[bookId - 1].IPFShash;
       
       //get author, title and others via front end from event BookAdded()
       
       return (_bookHash, IPFShash, owner, price);
    }
    
     
    /** 
     * @dev User fetches available books using filters. Client fetches for max of 50 at a time
     * @param _minPrice Minimum price filter (not implemented)
     * @param _maxPrice Maximum price filter (not implemented)
     * @return _booksHashes IPFS Reference Hashes of available books
     */
    function getAvailableBooks(uint _maxPrice, uint _minPrice, uint8 _count, uint _start) userExists(msg.sender) view external returns (bytes32[] memory){
        require(_count <= 50, "cannot fetch more than 50 books at once");
        
        // get already purchased books for removal
        bytes32[] memory myPurchasedBooks = getUserPurchasedBooks(msg.sender);
        bytes32[] memory newBooksPool = new bytes32[](_count);
        Book memory book;
        bytes32[] memory responseBooksHashes = new bytes32[](_count);
        
        do{
            // get books from pool of all books specifying expected count and starting bookID
            newBooksPool = listBooks(_start, _count);
            
            for(uint i = 0; i < newBooksPool.length; i++){
                
                for(uint j = 0; j < myPurchasedBooks.length; j++){
                    
                    book = booksArr[booksHashes[newBooksPool[i]] - 1];
                    
                    // remove from fetch pool unapproved or already purchased book
                    if(!book.isApproved || newBooksPool[i] == myPurchasedBooks[j]){
                        newBooksPool[i] = bytes32(0x0);
                        break;
                    }    
                }
                if(responseBooksHashes.length > _count){
                    break;
                }
                
                // if book hash is not already deleted, add to response
                if(newBooksPool[i] != bytes32(0x0)){
                    responseBooksHashes[i] = newBooksPool[i];
                }
            }
        }while(responseBooksHashes.length < _count);
        
        return responseBooksHashes;
    }
    
    /** 
     * @dev User requests for books paid for
     */
    function getMyPurchasedBooks() userExists(msg.sender) view public returns(bytes32[] memory _boughtBooks){
        _boughtBooks = boughtBooks[msg.sender];
    }
    
    /** 
     * @dev Requst books paid for by specified user
     * @param userAddress address of user
     */
    function getUserPurchasedBooks(address userAddress) userExists(userAddress) view public returns(bytes32[] memory _boughtBooks){
        _boughtBooks = boughtBooks[userAddress];
    }
    
    
    /** 
     * @dev Get some books incrementally (with range) from the large pool of books on blockchain
     * @param _start Book Id to start from
     * @param _count Number of books to fetch
     */
    function listBooks(uint _start, uint _count) userExists(msg.sender) view private returns(bytes32[] memory _booksHashes) {

        uint maxIters = _count;
        if( (_start + _count) > booksArr.length) {
            maxIters = booksArr.length - _start;
        }

        _booksHashes = new bytes32[](maxIters);

        for(uint i=0; i < maxIters; i++) {
            uint bookId = _start + i;

            _booksHashes[i] = booksArr[bookId].bookHash;
        }
    }
    
    /** 
     * @dev Generate/Validate Access key for user-specific access
     * @param userAddr Address of user owning key
     * @param IPFShash Book IPFS reference for which token is generated
     * @return accessToken User token assigned for book access
     */
    function generateAccessToken(address userAddr, bytes32 IPFShash) private
        pure returns(bytes32) { //isAdmin(msg.sender)
        bytes32 salt = "S}7#%*SD30o7D";
        bytes32 accessToken = keccak256(abi.encodePacked(userAddr, IPFShash, salt));
        return accessToken;
    }
    
}