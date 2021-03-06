import React, { Component } from "react";
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom";
import CentralBBookshop from "./contracts/CentralBBookshop.json";
import getWeb3 from "./getWeb3";
import truffleContract from 'truffle-contract';
import { MyProvider, UserContext } from "./utils/context/UserContext";
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";

import "./App.css";
import Loader from "./components/loader";


class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      web3: null, 
      accounts: null, 
      contract: null,
      isAuthorized: false,
      isAdmin: false,
      isSeller: false,
      isReader: false,
      pageLoading: true
    };

    this.userSignin = this.userSignin.bind(this);
  }

  componentWillUnmount=()=>{
    localStorage.removeItem('isAuthenticated');
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = CentralBBookshop.networks[networkId];
      const instance = new web3.eth.Contract(
        CentralBBookshop.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // const Contract = truffleContract(CentralBBookshop);
      // Contract.setProvider(web3.currentProvider);
      // const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance },
        () => this.userSignin());

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.methods.set(5).send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();

    // Update state with the result.
    this.setState({ storageValue: response });
  };

  userSignin = () =>{
    // sign user in
    const { accounts, contract } = this.state;
    let user = contract.methods.getUser().call({from: accounts[0]});
    user.then(response => {
      //authentication is successful
      console.log('user: ',response);

      if(response && response[0] == true){
        this.setState({isAuthorized: true});
        localStorage.setItem('isAuthenticated', true);
        // admin check
        if(response[2] == true){
          this.setState({isAdmin: true});
        }
        //is seller
        else if(response[1] == true){
          this.setState({isSeller: true});
        }
        else{
          this.setState({isReader: true});
        }
        this.setState({pageLoading: false});
      }
    }).catch(error=>{
      this.setState({isAuthorized: false});
      localStorage.setItem('isAuthenticated', false);
      this.setState({pageLoading: false});
    })   
    
  }

  render() {
    // if (!this.state.web3) {
    //   return <div>Loading Web3, accounts, and contract...</div>;
    // }
    if(this.state.pageLoading){
      return (
        <Loader type={'spinningBubbles'} size={'medium'} color={'#556cd6'} />
      );
    }
    else{
      return (
        <div className="App">
          <BrowserRouter>
            <MyProvider>
              <UserContext.Consumer>
                {(context) =>                
                      <Switch>
                        <Route exact path="/" render={()=>{return(this.state.isAuthorized ? <Redirect to="/bookshop"/> : <Redirect to="/unauthorized"/>)}} />
                        <Route exact path="/bookshop" render={props => {return(this.state.isAuthorized ? <Home {...props} context={context} baseAppState={this.state} />  : <Redirect to="/unauthorized"/> )} } />
                        <Route exact path="/unauthorized" render={props => {return(this.state.isAuthorized ? <Redirect to="/bookshop"/>  : <Unauthorized {...props} context={context} baseAppState={this.state} /> )}} />
                      </Switch>
                }
              </UserContext.Consumer>
            </MyProvider>
          </BrowserRouter>
        </div>
      );
    }
  }
}

export default App;
