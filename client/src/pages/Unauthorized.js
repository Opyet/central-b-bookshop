import React, { Component } from 'react';
import { Button, Container, Grid } from '@material-ui/core';
import Image from "material-ui-image";

class Unauthorized extends Component {
    constructor(props){
        super(props);
        this.state = {
            web3: null, 
            accounts: null, 
            contract: null,
            isAuthorized: false,
            selectUserCategoryOptions: false
          };

        this.onShopEntry = this.onShopEntry.bind(this);
        this.addNewUser = this.addNewUser.bind(this);
    }

    UNSAFE_componentWillMount =()=>{
        // if(localStorage.getItem('isAuthenticated')){
        //     window.href = "/";
        // }

        if(!this.state.accounts){
            this.setState({accounts: this.props.baseAppState.accounts})
            // this.setState({web3: this.props.baseAppState.web3})
            // this.setState({contract: this.props.baseAppState.contract})

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
    }

    componentDidUpdate() {

    }

    onShopEntry = (event) =>{
        event.preventDefault();
        this.setState({selectUserCategoryOptions: true});       
    }

    addNewUser = async (bookOwner) => {
        const contract = this.state.contract;
        const account = this.state.accounts[0];
        let response = await contract.methods.addUser(bookOwner).send({from: account});
        console.log('user: ', response);
        if(response.status == true && response.events.UserCreated){
            alert('you have been successfully registered');
            localStorage.setItem('isAuthenticated', true); 
            window.href="/";
        }
    }

    render() {
        if (this.state.selectUserCategoryOptions){
            
            if (window.confirm('Do you also want to enlist books (a Seller) in the bookshop? Clicking NO/CANCEL means you register as a Reader')) {
                // Book Owner
                this.addNewUser(true);
            } else {
                // Reader
                this.addNewUser(false);
            }      
            this.setState({selectUserCategoryOptions: false});       
        }
        return (
            <Container>
                <div className="home-wrapper">
                    <Grid container spacing={3}>
                        <Grid item sm={6}>
                            <section className="welcome">
                                <h1>Welcome the Central B-Bookshop!</h1>
                                <h3>Ensure that your MetaMask account is connected. Then click Enter Shop</h3>                
                                <Button variant="contained" color="primary" onClick={(e) => this.onShopEntry(e)} >Enter Shop</Button>
                            </section>
                        </Grid>
                        <Grid item sm={6}>
                            <section>
                                <Image src={require("../assets/img/bookshop.jpg")} />
                            </section>
                        </Grid>
                    </Grid>
                </div>
            </Container>            
        );
    }
}

export default Unauthorized;