import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import Web3 from 'web3';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getBalances', () => {
    it('should return the correct balances for valid addresses', async () => {
      const addresses = [
        '0x29805Ec2c4A1111ad81cA9d81801cEE8fa316f2E',
        'hello_world',
      ];

      const ethPriceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      );
      const ethPriceData = await ethPriceResponse.json();
      const ethPrice = ethPriceData.ethereum.usd;

      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          'https://mainnet.infura.io/v3/60ebd5823c834e488dec3fff235b7dcd',
        ),
      );

      const balanceInWei = await web3.eth.getBalance(
        '0x29805Ec2c4A1111ad81cA9d81801cEE8fa316f2E',
      );

      const balanceInEth =
        Math.floor(
          parseFloat(web3.utils.fromWei(balanceInWei, 'ether')) * 100,
        ) / 100;

      const expectedResponse = {
        wrong_addresses: ['hello_world'],
        wallets_and_balances: [
          {
            address: '0x29805Ec2c4A1111ad81cA9d81801cEE8fa316f2E',
            balance: Math.floor(balanceInEth * 100) / 100,
            usd_balances: Math.floor(0.16 * ethPrice * 100) / 100,
          },
        ],
      };

      const result = await controller.getBalances({ addresses });

      expect(result).toEqual(expectedResponse);
    });

    it('should return the correct error for invalid addresses', async () => {
      const addresses = ['invalid_address'];
      const expectedResponse = {
        wrong_addresses: ['invalid_address'],
        wallets_and_balances: [],
      };

      const result = await controller.getBalances({ addresses });

      expect(result).toEqual(expectedResponse);
    });
  });
});
