const ethers = require('ethers');

const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const TBTCDepositToken = require("@keep-network/tbtc/artifacts/TBTCDepositToken.json");
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");
const VendingMachine = require("@keep-network/tbtc/artifacts/VendingMachine.json");

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);

		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
		const tdtContract = new ethers.Contract(TBTCDepositToken.networks["1"].address, TBTCDepositToken.abi, ip);
		const vendingContract = new ethers.Contract(VendingMachine.networks["1"].address, VendingMachine.abi, ip);

		const transfers = await tdtContract.queryFilter(tdtContract.filters.Transfer(null, vendingContract.address));
		const tokenIDs = transfers.map(t => { return t.args[2].toHexString()});

		for (let addr of tokenIDs) {
			const d = new ethers.Contract(addr, Deposit.abi, ip);
			const depositActive = await d.inActive();
			const vOwns = (await tdtContract.ownerOf(d.address)) === vendingContract.address;

			if (depositActive && vOwns)
				console.log(`TDT ${d.address} (${ethers.utils.formatEther(await d.lotSizeTbtc())} tBTC) is active and owned by the vending machine`);
		}

	} catch(err) {
		console.error(`Could not check for TDTs: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})


