const Lottery = artifacts.require("Lottery");
//const: 변수 재선언, 재할당 불가
const assertRevert = require ('./assertRevert');
const expectEvent = require ('./expectEvent');

contract('Lottery', function([deployer, user1, user2]){
    let lottery; //let: 변수 할당 (재할당 가능)
    let betAmount = 5000000000000000;
    let bet_block_interval = 3;
    let betAmountBN = new web3.utils.BN('5000000000000000');
    //비동기 (async): 특정 코드의 연산이 끝날 때까지 기다려주지 않고 나머지 코드를 먼저 실행
    // e.g., '서버에 대한 요청 코드 -> 단순 연산' 의 구조를 가지는 코드에서 동기 처리라면 서버에 대한 응답이 올 때까지 단순 연산을 수행하지 않음. 단순 연산 실행을 위해 기다려야 하는 시간이 생기는 문제...
    // 해결: callback function, Promise, async~await
    // async function 함수명 () {
    //     await 비동기_처리_메서드명();
    // }
    //mocha 테스트 환경 구성: beforeEach -> it -> afterEach
    beforeEach(async () => {
        // console.log('Before each')

        lottery = await Lottery.new()   //새로운 객체 생성
    })

    it('getPot should return current pot', async () => {   //.only: 이 영역만 테스트
        // console.log('getPot test')
        let pot = await lottery.getPot();
        assert.equal(pot, 0)

    })

    describe('Bet', function() {
        it('should fail when the bet money is not 0.005 ETH', async () => {   
            //it.only: 이 영역만 테스트
            //Fail transaction
            await assertRevert ('0xab', {from: user1, value: 4000000000000000}) //실패한 transaction test
            // transaction object {chainId, value, to, from, gas(Limit), gasPrice}
    
        })
        
        it('should put the bet to the bet queue with 1 bet', async () => {   
            // bet
            let receipt = await lottery.bet ('0xab', {from: user1, value: betAmount})
            // console.log(receipt);

            let pot = await lottery.getPot();
            assert.equal (pot, 0);

            // check contract balance == 0.005
            let contractBalance = await web3.eth.getBalance(lottery.address);
            console.log (contractBalance);
            assert.equal(contractBalance, betAmount);

            // check bet info
            let currentBlockNumber = await web3.eth.getBlockNumber();   //마이닝된 블록 번호
            let bet = await lottery.getBetInfo(0);
            assert.equal (bet.answerBlockNumber, currentBlockNumber + bet_block_interval);
            assert.equal (bet.bettor, user1);
            assert.equal (bet.challenges, '0xab');

            // check log
            // console.log(receipt);
            await expectEvent.inLogs(receipt.logs, 'BET');  //해당하는 이벤트가 잘 나왔는지 확인
    
        })
    })

    describe('Distribute', function () {
        describe('When the answer is checkable', function () {
            it('should give the user the pot when the answer matches', async () => {
                // 두 글자 다 맞았을 때
                await lottery.setAnswerForTest('0xabef3057e787c69136c37b33425a7d99224be93ccca72069113560f830c21828', {from:deployer})
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 1 -> 4
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 2 -> 5
                await lottery.betAndDistribute('0xab', {from:user1, value:betAmount})   // 3 -> 6 (answer)
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 4 -> 7
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 5 -> 8 
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 6 -> 9
                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                let receipt7 = await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 7 -> 10 // user1에게 pot을 전달

                let potAfter = await lottery.getPot();  // 분배 후 => 0
                let user1BalanceAfter = await web3.eth.getBalance(user1);   // before + 0.015 ETH

                // pot의 변화량 확인
                assert.equal(potBefore.toString(), new web3.utils.BN('10000000000000000').toString());
                assert.equal(potAfter.toString(), new web3.utils.BN('0').toString());

                // user(winner)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(potBefore).add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());

                // console.log(typeof user1BalanceBefore)

                it('should give the user the amount he or she bet when a single character mathces', async () => {
                // 한 글자 맞았을 때
                await lottery.setAnswerForTest('0xabef3057e787c69136c37b33425a7d99224be93ccca72069113560f830c21828', {from:deployer})
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 1 -> 4
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 2 -> 5
                await lottery.betAndDistribute('0xaf', {from:user1, value:betAmount})   // 3 -> 6 (answer)
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 4 -> 7
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 5 -> 8 
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 6 -> 9
                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                let receipt7 = await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 7 -> 10 // user1에게 pot을 전달

                let potAfter = await lottery.getPot();  // 0.01 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1);   // before + 0.005 ETH

                // pot의 변화량 확인
                assert.equal(potBefore.toString(), potAfter.toString());

                // user(winner)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter).toString());
            })

            it('should give the eth of user whten ther answer does not match at all', async () => {
                // 다 틀렸을 때
                await lottery.setAnswerForTest('0xabef3057e787c69136c37b33425a7d99224be93ccca72069113560f830c21828', {from:deployer})
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 1 -> 4
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 2 -> 5
                await lottery.betAndDistribute('0xef', {from:user1, value:betAmount})   // 3 -> 6 (bet)
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 4 -> 7
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 5 -> 8 
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 6 -> 9
                let potBefore = await lottery.getPot(); // 0.01 ETH
                let user1BalanceBefore = await web3.eth.getBalance(user1);
                
                let receipt7 = await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 7 -> 10 // user1에게 pot을 전달

                let potAfter = await lottery.getPot();  // 0.015 ETH
                let user1BalanceAfter = await web3.eth.getBalance(user1);   // before - 0.005 ETH

                // pot의 변화량 확인
                assert.equal(potBefore.add(betAmountBN).toString(), potAfter.toString());

                // user(winner)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString());
                
            })

                
            })
        })
        describe('When the answer is not revealed (not mined)', function () {
            it('check the user1Balance, pot', async () => {
                await lottery.setAnswerForTest('0xabef3057e787c69136c37b33425a7d99224be93ccca72069113560f830c21828', {from:deployer})
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 1 -> 4
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 2 -> 5
                await lottery.betAndDistribute('0xab', {from:user1, value:betAmount})   // 3 -> 6 (user1 bet the amount and he or she will be winner)
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 4 -> 7
                await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 5 -> 8 

                let potBefore = await lottery.getPot();
                let user1BalanceBefore = await web3.eth.getBalance(user1).then(console.log);

                let receipt6 = await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 6 -> 9
                
                let potAfter = await lottery.getPot();  // before + 0.05
                console.log(potAfter.toString())    // 0.01 ETH (6번 블록이 마이닝되면 1번, 2번 betting을 확인할 수 있기 때문에 0.005 * 2 ETH가 pot에 쌓임)
                let user1BalanceAfter = await web3.eth.getBalance(user1).then(console.log); // before (확인이 안되니 돌려준다)

                // 확인 1 : 확인이 불가능할 때 
                // pot의 변화량
                potBefore = new web3.utils.BN(potBefore);
                assert.equal(potBefore.add(betAmountBN).toString(), new web3.utils.BN(potAfter).toString());
                // user(winner)의 밸런스를 확인
                user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
                assert.equal(user1BalanceBefore.toString(), new web3.utils.BN(user1BalanceAfter).toString());

                // let receipt7 = await lottery.betAndDistribute('0xef', {from:user2, value:betAmount})   // 7 -> 10 // user1에게 pot을 전달

                // let potAfter2 = await lottery.getPot();  // 0
                // let user1BalanceAfter2 = await web3.eth.getBalance(user1).then(console.log); // before + 0.015 ETH

                // // 확인 2: 확인이 가능할 때
                // // pot의 변화량
                // assert.equal(potAfter2.toString(), new web3.utils.BN('0').toString());  // pot money is 0
                            
                // // user(winner)의 밸런스를 확인
                // user1BalanceAfter = new web3.utils.BN(user1BalanceAfter);
                // assert.equal(user1BalanceAfter.add(potAfter).add(betAmountBN).toString(), new web3.utils.BN(user1BalanceAfter2).toString()); // AssertionError

            })           
        })
        describe('When the answer is not revealed (block limit is passed)', function () {
            // ganache-cli의 evm_mine을 이용
        })

    })

    describe('isMatch', function () {
        let blockHash = '0xabef3057e787c69136c37b33425a7d99224be93ccca72069113560f830c21828'
        it('should be BettingResult.Win when two characters match', async () => {
            let matchingResult = await lottery.isMatch('0xab', blockHash);
            assert.equal(matchingResult, 1);
        })

        it('should be BettingResult.Fail when any character does not match', async () => {
            
            let matchingResult = await lottery.isMatch('0xcd', blockHash);
            assert.equal(matchingResult, 0);
        })

        it('should be BettingResult.Draw when one character match', async () => {
            let matchingResult = await lottery.isMatch('0xaf', blockHash);
            assert.equal(matchingResult, 2);

            matchingResult = await lottery.isMatch('0xfb', blockHash);
            assert.equal(matchingResult, 2);
        })

        
    })

});