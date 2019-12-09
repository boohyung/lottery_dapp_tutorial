import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Web3 from 'web3';

let lotteryAddress = '0x35d342d19F797ffB09B7E445e215BF908e9482E0'; // 배포한 컨트랙트 주소
let lotteryABI = [{ "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }], "name": "BET", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }], "name": "DRAW", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }], "name": "FAIL", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }], "name": "REFUND", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "indexed": false, "internalType": "bytes1", "name": "answer", "type": "bytes1" }, { "indexed": false, "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }], "name": "WIN", "type": "event" }, { "constant": true, "inputs": [], "name": "answerForTest", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "getPot", "outputs": [{ "internalType": "uint256", "name": "pot", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "internalType": "bytes1", "name": "challenges", "type": "bytes1" }], "name": "betAndDistribute", "outputs": [{ "internalType": "bool", "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": false, "inputs": [{ "internalType": "bytes1", "name": "challenges", "type": "bytes1" }], "name": "bet", "outputs": [{ "internalType": "bool", "name": "result", "type": "bool" }], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": false, "inputs": [], "name": "distribute", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "internalType": "bytes32", "name": "answer", "type": "bytes32" }], "name": "setAnswerForTest", "outputs": [{ "internalType": "bool", "name": "result", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "internalType": "bytes1", "name": "challenges", "type": "bytes1" }, { "internalType": "bytes32", "name": "answer", "type": "bytes32" }], "name": "isMatch", "outputs": [{ "internalType": "enum Lottery.BettingResult", "name": "", "type": "uint8" }], "payable": false, "stateMutability": "pure", "type": "function" }, { "constant": true, "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "getBetInfo", "outputs": [{ "internalType": "uint256", "name": "answerBlockNumber", "type": "uint256" }, { "internalType": "address", "name": "bettor", "type": "address" }, { "internalType": "bytes1", "name": "challenges", "type": "bytes1" }], "payable": false, "stateMutability": "view", "type": "function" }]
// ABI

class App extends Component {

constructor(props) {
  super(props);

  this.state = {
    betRecords: [],
    winRecords: [],
    failRecords: [],
    pot: '0',
    challenges: ['A', 'B'],
    finalRecords: [{
      bettor:'0xabcd...',
      index:'0',
      challenges:'ab',
      answer:'ab',
      targetBlockNumber:'10',
      pot:'0'
    }]
  }
}
  async componentDidMount() {
    await this.initWeb3()
    await this.getBetEvents()
  }

  initWeb3 = async () => {
    // Metamask와 react app을 연결 https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    if (window.ethereum) {
      console.log('recent mode')
      this.web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
        // Acccounts now exposed
        // this.web3.eth.sendTransaction({/* ... */});
      } catch (error) {
        // User denied account access...
        console.log(`User denied account access error: ${error}`)
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log.og('legacy mode')
      this.web3 = new Web3(Web3.currentProvider);
      // Acccounts always exposed
      // this.web3.eth.sendTransaction({/* ... */ });
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }

    let accounts = await this.web3.eth.getAccounts();
    this.account = accounts[0];

    this.lotteryContract = new this.web3.eth.Contract(lotteryABI, lotteryAddress);
    // console.log(this.lotteryContract)

    // let pot = await this.lotteryContract.methods.getPot().call()  // 배포된 contract의 getPot()을 call
    // console.log(pot)
    // let owner = await this.lotteryContract.methods.owner().call()  // 배포된 contract의 owner call
    // console.log(owner)

  }

  getBetEvents = async () => {
    const records = [];
    let events = await this.lotteryContract.getPastEvents('BET', { fromBlock: 0, toBlock: 'latest' });
    console.log(events)
  }

  bet = async () => {

    // nonce: 해당 account가 transaction을 몇 개나 만들었는지 알려주는 값 (replay attack 방지), transaction을 보낼 때는 nonce를 반드시 추가해야 함
    let nonce = await this.web3.eth.getTransactionCount(this.account);
    this.lotteryContract.methods.betAndDistribute('0xcd').send({ from: this.account, value: 5000000000000000, gas: 300000, nonce: nonce })  // lottery 컨트랙트를 통해 tx를 send
  }

  // Pot money

  // bet 글자 선택 UI (버튼 형식)
  // Bet button

  // History table
    // index (내림차순), address challenge answer pot status answerBlockNumber


  getCard = (_Character, _cardStyle) => {
    let _card = '';
    if(_Character === 'A') {
      _card = '🂡'
    }
    if(_Character === 'B') {
      _card = '🂱'
    }
    if(_Character === 'C') {
      _card = '🃁'
    }
    if(_Character === 'D') {
      _card = '🃑'
    }
    return (
      <button className={_cardStyle}>
        <div className="card-body text-center">
          <p className="card-text"></p>
          <p className="card-text text-center" style={{fontSize:200}}>{_card}</p>
          <p className="card-text"></p>
        </div>  
      </button>
    )
  }
  
  render() {
    return (
      <div className="App">
        {/* Header = Pot, Betting characters */}
          <div className="container">
            <div className="jumbotron">
              <h1>Current Pot : {this.state.pot}</h1>
              <p>Lottery</p>
              <p>Lottery tutorial</p>
              <p>Your Bet</p>
              <p>{this.state.challenges[0]} {this.state.challenges[1]}</p>
            </div>
          </div>
          {/* Card section */}
          <div className="container">
            <div className="card-group">
              {this.getCard('A', 'card bg-primary')}
              {this.getCard('B', 'card bg-warning')}
              {this.getCard('C', 'card bg-danger')}
              {this.getCard('D', 'card bg-success')}
            </div>
          </div>
          <br></br>
          <div className="container">
            <button className="btn btn-danger btn-lg">BET!</button>
          </div>
          
          <br></br>
          <div className="container">
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Address</th>
                  <th>Challenge</th>
                  <th>Answer</th>
                  <th>Pot</th>
                  <th>Status</th>
                  <th>AnswerBlockNumber</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.finalRecords.map((record, index) => {
                    return (
                      <tr key={index}>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                      </tr>
                    )
                  }) 
                }
              </tbody>
            </table>
          </div>
        
      </div>
    );
  }
}


export default App;
