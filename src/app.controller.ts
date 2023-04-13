import { Controller, Post, Body } from '@nestjs/common';
import Web3 from 'web3';
import fetch from 'node-fetch';

@Controller('balances')
export class AppController {
  public readonly ethereumPriceUrl =
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
  public readonly web3Provider =
    'https://mainnet.infura.io/v3/60ebd5823c834e488dec3fff235b7dcd';
  public readonly web3: Web3;

  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(this.web3Provider));
  }

  @Post()
  async getBalances(@Body() body: { addresses: string[] }) {
    const addresses = body.addresses;
    console.log('addresses:', addresses);

    const validAddresses = [];
    const wrongAddresses = [];

    for (let i = 0; i < addresses.length; i++) {
      if (this.web3.utils.isAddress(addresses[i])) {
        validAddresses.push(addresses[i]);
      } else {
        wrongAddresses.push(addresses[i]);
      }
    }

    console.log('validAddresses:', validAddresses);
    console.log('wrongAddresses:', wrongAddresses);

    const response = await fetch(this.ethereumPriceUrl); //Coingecko API
    const data = await response.json();
    const ethereumPrice = data.ethereum.usd;

    console.log('ethereumPrice:', ethereumPrice);

    const walletBalances = [];
    let walletsAndBalances = [];

    walletsAndBalances = validAddresses.map(async (address) => {
      const balanceWei = await this.web3.eth.getBalance(address);
      const balanceEth =
        Math.floor(
          parseFloat(this.web3.utils.fromWei(balanceWei, 'ether')) * 100,
        ) / 100;

      const usdBalance = Math.floor(address * ethereumPrice * 100) / 100;

      return { address, balanceEth, usdBalance };
    });

    /* for (let i = 0; i < validAddresses.length; i++) {
      const balanceWei = await this.web3.eth.getBalance(validAddresses[i]);

      const balanceEth =
        Math.floor(
          parseFloat(this.web3.utils.fromWei(balanceWei, 'ether')) * 100,
        ) / 100;

      walletBalances.push(balanceEth);
      walletsAndBalances.push({
        address: validAddresses[i],
        balance: walletBalances[i],
        usd_balances: Math.floor(walletBalances[i] * ethereumPrice * 100) / 100,
      });
    } */

    console.log('walletsAndBalances:', walletsAndBalances);

    walletsAndBalances.sort((a, b) => b.balance - a.balance);

    return {
      wrong_addresses: wrongAddresses,
      wallets_and_balances: await Promise.all(walletsAndBalances),
    };
  }
}
