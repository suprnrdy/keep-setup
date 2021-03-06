const ethers = require('ethers');

const BondedECDSAKeepFactory = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeepFactory.json")
const BondedECDSAKeep = require("@keep-network/keep-ecdsa/artifacts/BondedECDSAKeep.json")
const TBTCSystem = require("@keep-network/tbtc/artifacts/TBTCSystem.json")
const TBTCDepositToken = require("@keep-network/tbtc/artifacts/TBTCDepositToken.json");
const DepositLog = require("@keep-network/tbtc/artifacts/DepositLog.json");
const Deposit = require("@keep-network/tbtc/artifacts/Deposit.json");

if (process.argv.length < 3 || !process.argv[2]) {
	console.error('node find_tdts.js [keep]');
	process.exit(1);
}

const states = [
	"START",
	"AWAITING_SIGNER_SETUP",
	"AWAITING_BTC_FUNDING_PROOF",
	"FAILED_SETUP",
	"ACTIVE",  // includes courtesy call
	"AWAITING_WITHDRAWAL_SIGNATURE",
	"AWAITING_WITHDRAWAL_PROOF",
	"REDEEMED",
	"COURTESY_CALL",
	"FRAUD_LIQUIDATION_IN_PROGRESS",
	"LIQUIDATION_IN_PROGRESS",
	"LIQUIDATED"
];

async function main() {
	try {
		const ip = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_API);
		const kAddr = process.argv[2].toLowerCase();

		//const keepFactory = new ethers.Contract(TBTCSystem.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const ecdsaKFContract = new ethers.Contract(BondedECDSAKeepFactory.networks["1"].address, BondedECDSAKeepFactory.abi, ip);
		const tbtcSysContract = new ethers.Contract(TBTCSystem.networks["1"].address, TBTCSystem.abi, ip);
		const tdtContract = new ethers.Contract(TBTCDepositToken.networks["1"].address, TBTCDepositToken.abi, ip);
		const depositLogContract = new ethers.Contract(TBTCSystem.networks["1"].address, DepositLog.abi, ip);

		const k = new ethers.Contract(kAddr, BondedECDSAKeep.abi, ip);
		const tdt = await depositLogContract.queryFilter(depositLogContract.filters.Created(null, kAddr));
		if (tdt.length < 1) {
			console.log(`No TDT found`)
			return
		}
		const d = new ethers.Contract(tdt[0].args[0], Deposit.abi, ip);
		const depositState = states[await d.currentState()];
		//const keepActive = (await k.isActive()) ? "active" : "inactive";
		//const depositActive = (await d.inActive()) ? "active" : "inactive";

		console.log(`keep ${kAddr} manages TDT ${d.address} (${ethers.utils.formatEther(await d.lotSizeTbtc())} tBTC) with state: ${depositState}`);

	} catch(err) {
		console.error(`Could not authorize: ${err.message}`)
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err);
})


