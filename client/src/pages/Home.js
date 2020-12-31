import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ipfs from '../ipfs.js';
import { Container, Grid, Paper, Button, Box, TextField, TextareaAutosize } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import NavBar from '../components/navbar.js';
import BooksTable from '../components/booksTable.js';
import Loader from '../components/loader.js';
import Validator from '../utils/validator.js';
import HashHelper from '../utils/hashHelper.js';


class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            web3: null,
            accounts: null,
            contract: null,
            isAdmin: false,
            isSeller: false,
            isReader: false,
            isDocSelected: false,  
            sellerAddressToApprove: '',
            ownedBooks: null,
            bookProps: {
                author: '',
                title: '',
                price: 0,
                commission: 0,
                ipfsHash: '',
                ipfsMultiHash: null,
            },
            loading: {
                uploadDoc: false,
                approveSeller: false
            },
            error: {
                uploadDoc: '',
                approveSeller: ''
            },
            success: {
                uploadDoc: '',
                approveSeller: ''
            }
        }
        
        this.setEventListeners = this.setEventListeners.bind(this);
        this.onIPFSSubmit = this.onIPFSSubmit.bind(this);
        this.resetDocumentSelection = this.resetDocumentSelection.bind(this);
        this.resetMessage = this.resetMessage.bind(this);
        this.onChangeAuthorHandler = this.onChangeAuthorHandler.bind(this);
        this.onChangeCommissionHandler = this.onChangeCommissionHandler.bind(this);
        this.onChangePriceHandler = this.onChangePriceHandler.bind(this);
        this.onChangeTitleHandler = this.onChangeTitleHandler.bind(this);
        this.sellerAddressHandler = this.sellerAddressHandler.bind(this);
        this.fetchOwnedBooks = this.fetchOwnedBooks.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if(!this.state.accounts){
            this.setState({accounts: this.props.baseAppState.accounts}, () => this.fetchOwnedBooks())
                //this.props.context.updateContext('accounts', this.state.accounts));            
        }        
        if(!this.state.web3){
            this.setState({web3: this.props.baseAppState.web3})
                //this.props.context.updateContext('web3', this.state.web3));
        }
        if(!this.state.contract){
            this.setState({contract: this.props.baseAppState.contract})
                //this.props.context.updateContext('contract', this.state.contract));
        }

        if(this.props.baseAppState.isAdmin && !this.state.isAdmin){
            this.setState({isAdmin: true});
        }else if(this.props.baseAppState.isSeller && !this.state.isSeller){
            this.setState({isSeller: true});
        }else{
            if(!this.state.isReader){
                this.setState({isReader: true});
            }
        }

        // if(this.state.accounts){
        //     this.fetchOwnedBooks();
        // }
    }

    setEventListeners(){
        this.state.contract.inboxResponse()
          .on('data', result => {
            this.setState({receivedIPFS: result.args[0]})
        });
    }

    //turn submitted file into buffer
    captureFile = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const file = event.target.files[0];
        let reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => this.convertToBuffer(reader);
        this.setState({isDocSelected: true});
    };

    //helper function for turning file to buffer
    convertToBuffer = async(reader) => {
        const buffer = await Buffer.from(reader.result);
        this.setState({buffer});
    };

    resetDocumentSelection = ()=>{
        this.setState({buffer: null});
        this.setState({isDocSelected: false});
    }

    onChangeAuthorHandler=(event)=>{
        event.persist();
        this.setState(prevState => ({
            bookProps: {
                ...prevState.bookProps,
                author: event.target.value
        }})); 
    }

    onChangePriceHandler=(event)=>{
        event.persist();
        this.setState(prevState => ({
            bookProps: {
                ...prevState.bookProps,
                price: event.target.value
        }})); 
    }

    onChangeCommissionHandler=(event)=>{
        event.persist();
        this.setState(prevState => ({
            bookProps: {
                ...prevState.bookProps,
                commission: event.target.value
        }})); 
    }

    onChangeTitleHandler=(event)=>{
        event.persist();
        this.setState(prevState => ({
            bookProps: {
                ...prevState.bookProps,
                title: event.target.value
        }})); 
    }

    resetMessage = () =>{
        let errors = Object.keys(this.state.error);
        for(var propIndex in errors){

            let prop = errors[propIndex];
            console.log(prop);

            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    [prop]: ''
            }}));
            
            //console.log(this.state.error);
        }
        
        //this.setState({success: null});
    }

    onIPFSSubmit = async(event)=>{
        event.preventDefault();
        this.resetMessage();

        let price = this.state.bookProps.price;
        let title = this.state.bookProps.title;
        let commission = this.state.bookProps.commission;
        let author = this.state.bookProps.author;

        if(author === '' || title === '' || price === '' || commission === ''){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadDoc: 'Incomplete Details — All fields are required!'
            }})); 
            return;
        }

        // validate data
        let validator = new Validator();

        if(!validator.isValidPrice(price)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadDoc: 'Invalid Price — Book price must be a number that is not less than 0!'
            }})); 
            return;
        }

        if(!validator.isValidCommission(commission)){
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadDoc: 'Invalid Commission — Book sales commission must be a percentage number between 0-100!'
            }})); 
            return;
        }

        this.setState(prevState => ({
            loading: {
                ...prevState.loading,
                uploadDoc: true
        }}));        
        
        let data = this.state.buffer;
        if(data){
            ipfs.add(data)
            .then((ipfsHash) => {
                //console.log(ipfsHash);
                this.setState(prevState => ({
                    bookProps: {
                        ...prevState.bookProps,
                        ipfsHash: ipfsHash.path
                }}));
                this.setState(prevState => ({
                    bookProps: {
                        ...prevState.bookProps,
                        ipfsMultiHash: ipfsHash.cid.multihash
                }}));

                //this.setState({ipfsHash:ipfsHash.path});
                //this.setState({ipfsMultiHash:ipfsHash.cid.multihash});
                this.setState(prevState => ({
                    loading: {
                        ...prevState.loading,
                        uploadDoc: false
                }}), this.resetDocumentSelection());

                //TODO: send to blockchain
                this.addBook(this.state.bookProps);

                this.setState(prevState => ({
                    success: {
                        ...prevState.success,
                        uploadDoc: 'Book has been successfully added!'
                }})); 
                console.log('complete ipfs upload');                
            })
            .catch(err => {
                console.log(err);
            })
        }else{
            console.log('no file was selected. reload page and select file');
            // this.setState(prevState => ({
            //     loading: {
            //         ...prevState.loading,
            //         uploadDoc: false
            // }}), this.resetDocumentSelection());
        }
    };
    
    addBook(bookProps){
        const contract = this.state.contract;
        const account = this.state.accounts[0];
        let hashHelper = new HashHelper();

        let IPFShash = hashHelper.getBytes32FromIpfsHash(bookProps.ipfsHash);
        let title = bookProps.title;
        let author = bookProps.author;
        let commission = bookProps.commission;
        let price = bookProps.price;

        console.log(IPFShash, title, author, price, commission);
        let response = contract.methods.addBook(IPFShash, title, author, price, commission).send({from: account});
        
        response.then(result => {
            console.log('add book: ', result);
            if(result.status && result.events.BookAdded){
                this.setState(prevState => ({
                    success: {
                        ...prevState.success,
                        uploadDoc: 'Success — New Book was added successfully!'
                }}));
            }else{
                this.setState(prevState => ({
                    error: {
                        ...prevState.error,
                        uploadDoc: 'Error — A minor error occured. Take a look at the log'
                }})); 
            }
            this.fetchOwnedBooks();
        }).catch(error=>{
            console.log('add book error: ', error);
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    uploadDoc: error.message
            }})); 
        }); 
    }

    fetchOwnedBooks = () =>{
        const contract = this.state.contract;
        const account = this.state.accounts[0];

        let response = contract.methods.getOwnedBooks().call({from: account});
        response.then(result => {
            console.log('owned books: ', result);
            let ownedBooks = [];
            for(var i=0; i< result.length; i++){
                ownedBooks.push({id: i+1, bookHash: result[i]});
            }            
            this.setState({ownedBooks: ownedBooks});             
        }).catch(error=>{
            console.log('owned books error: ', error);            
        }); 
    }


    sellerAddressHandler =(event)=>{
        event.persist();
        this.setState({sellerAddressToApprove: event.target.value}); 
    }

    approveSeller=(event)=>{
        event.preventDefault();
        const contract = this.state.contract;
        const account = this.state.accounts[0];

        let response = contract.methods.approveSeller(this.state.sellerAddressToApprove).send({from: account});
        response.then(result => {
            console.log('seller approval: ', result);
            if(result.status && result.events.SellerApproved){
                this.setState(prevState => ({
                    success: {
                        ...prevState.success,
                        approveSeller: 'Success — Seller was successfully approved!'
                }})); 
            }else{
                this.setState(prevState => ({
                    error: {
                        ...prevState.error,
                        approveSeller: 'Error — A minor error occured. Take a look at the log'
                }})); 
            }
        }).catch(error=>{
            console.log('seller approval error: ', error);
            this.setState(prevState => ({
                error: {
                    ...prevState.error,
                    approveSeller: error.message
            }})); 
        }); 
    }

    render() {
        //ADMIN
        if(this.state.isAdmin){
            return (
                <div>
                    <NavBar category={"ADMIN"} account={this.state.accounts ? this.state.accounts[0] : null}/>
                    <Container>
                        <Grid container spacing={1}>
                            <Grid item sm={6}>
                                <Box m={4}>
                                    <Paper elevation={2}>    
                                        <Box p={3}>                                    
                                            <span className="card-title">Approve Seller</span>
                                            <form id="" className="" autoComplete="off">
                                                <section>
                                                    {this.state.error.approveSeller ? 
                                                        <Alert severity="error">
                                                            <AlertTitle>Error</AlertTitle>
                                                            {this.state.error.approveSeller}
                                                        </Alert>:null
                                                    }
                                                    {this.state.success.approveSeller ? 
                                                    <Alert severity="success">
                                                        <AlertTitle>Success</AlertTitle>
                                                        {this.state.success.approveSeller}
                                                    </Alert>:null
                                                    }
                                                    
                                                    <Box mt={2}>
                                                        <Grid container spacing={2}>
                                                            <Grid item md={12} sm={12}>
                                                                <TextField onChange={this.sellerAddressHandler} id="" required={true} label="Address of seller to approve" variant="outlined" fullWidth={true}/>
                                                            </Grid>                                                            
                                                        </Grid>
                                                    </Box>  
                                                    
                                                    
                                                    <Box mt={2}>
                                                        <Button onClick={(e) => this.approveSeller(e)} variant="contained" color="secondary" component="span">
                                                            Approve
                                                        </Button>
                                                        {this.state.loading.approveSeller ? <Loader type={'spinningBubbles'} size={'small'} color={'#556cd6'} />: null}   
                                                    </Box>                                                                                                     
                                                </section>                                                
                                            </form>                                
                                        </Box>
                                    </Paper>
                                </Box>  
                            </Grid>
                            <Grid item sm={3}>
                                <Box m={4}>
                                    <Paper elevation={2}>
                                        <Box p={3}>
                                            <span className="card-title">Books Count</span>
                                            <span className="figures">--</span>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Grid>
                            <Grid item sm={3}>
                                <Box m={4}>
                                    <Paper elevation={2}>
                                        <Box p={3}>
                                            <span className="card-title">Purchases Today</span>
                                            <span className="figures">--</span>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>                        
                    </Container>
                </div>
            );
        }
        // SELLER
        else if(this.state.isSeller){
            return (
            <div>
                <NavBar category={"BOOK OWNER"} account={this.state.accounts ? this.state.accounts[0] : null}/>
                <Container>
                    <Grid container spacing={1}>
                        <Grid item sm={6}>
                            <Box m={4}>
                                <Paper elevation={2}>    
                                    <Box p={3}>                                    
                                        <h2 className="card-title">Add New Book</h2>
                                        <form id="ipfs-hash-form" className="book-submit-form" autoComplete="off">
                                            {/* <input type="file" onChange={this.captureFile} />
                                            <Button variant="contained" color="secondary">Upload Book</Button>*/}
                                            <span style={{display:'block', marginBottom:'15px'}}>You can upload your new book here:</span>
                                            <input onChange={this.captureFile} accept="application/pdf" style={{display:'none'}} id="contained-button-file" multiple type="file"/>
                                            
                                            {!this.state.isDocSelected ? 
                                            <label htmlFor="contained-button-file">                                                
                                                    <Button variant="contained" color="primary" component="span">
                                                        Select Document
                                                    </Button>
                                            </label>:
                                            <section>
                                                {this.state.error.uploadDoc ? 
                                                    <Alert severity="error">
                                                        <AlertTitle>Error</AlertTitle>
                                                        {this.state.error.uploadDoc}
                                                    </Alert>:null
                                                }
                                                {this.state.success.uploadDoc ? 
                                                <Alert severity="success">
                                                    <AlertTitle>Success</AlertTitle>
                                                    {this.state.success.uploadDoc}
                                                </Alert>:null
                                                }
                                                
                                                <Box mt={2}>
                                                    <Grid container spacing={2}>
                                                        <Grid item md={12}>
                                                            <TextField onChange={this.onChangeTitleHandler} id="" required={true} label="Book Title" variant="outlined" fullWidth={true}/>
                                                        </Grid>
                                                        <Grid item md={12}>
                                                            <TextField onChange={this.onChangeAuthorHandler} id="" required={true} label="Author" variant="outlined" fullWidth={true} />
                                                        </Grid>                                                    
                                                        <Grid item md={6}>
                                                            <TextField 
                                                                onChange={e => this.onChangePriceHandler(e)}
                                                                required={true} fullWidth={true}
                                                                type="number"
                                                                label="Price"
                                                                variant="outlined" 
                                                                InputProps={{
                                                                    inputProps: { 
                                                                        min: 0
                                                                    }
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid item md={6}>
                                                            <TextField id="" 
                                                                onChange={e => this.onChangeCommissionHandler(e)}
                                                                required={true} fullWidth={true}
                                                                type="number"
                                                                label="Commission"
                                                                variant="outlined" 
                                                                InputProps={{
                                                                    inputProps: { 
                                                                        min: 0
                                                                    }
                                                                }
                                                            }/>   
                                                        </Grid>
                                                    </Grid>
                                                </Box>  
                                                
                                                
                                                <Box mt={2}>
                                                    <Button onClick={(e) => this.onIPFSSubmit(e)} variant="contained" color="secondary" component="span">
                                                        Upload Book Now
                                                    </Button>
                                                    {this.state.loading.uploadDoc ? <Loader type={'spinningBubbles'} size={'small'} color={'#556cd6'} />: null}
                                                </Box>                                                
                                                <span style={{marginTop:'10px'}} className="hint-text text-secondary">Document is selected. You can upload now</span>
                                            </section>
                                            }
                                        </form>                                
                                    </Box>
                                </Paper>
                            </Box>  
                        </Grid>
                        <Grid item sm={3}>
                            <Box m={4}>
                                <Paper elevation={2}>
                                    <Box p={3}>
                                        <h2 className="card-title">Owned Books</h2>
                                        <span className="figures">{this.state.ownedBooks ? this.state.ownedBooks.length : "0"}</span>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                        <Grid item sm={3}>
                            <Box m={4}>
                                <Paper elevation={2}>
                                    <Box p={3}>
                                        <h2 className="card-title">Purchases Today</h2>
                                        <span className="figures">{this.state.numberPurchasesOwnedBooks ? this.state.numberPurchasesOwnedBooks : "--"}</span>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                    <Box pb={3}>
                        <Paper elevation={2}>  
                            <Box p={3}>
                                <h2 className="card-title">My Uploaded/Owned Books</h2>                      
                                <BooksTable rows={this.state.ownedBooks ? this.state.ownedBooks : []}/>     
                            </Box>                   
                        </Paper>
                    </Box>
                </Container>
            </div>
            );
        }
        // READERS
        else {
            return (
                <div>
                    <NavBar category={"READER"} account={this.state.accounts ? this.state.accounts[0] : null}/>
                </div>
            );
        }
    }
}


export default Home;