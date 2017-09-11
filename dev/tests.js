function checkCalculate(assert, stp, expectedAva) {
	for (var threads = 1; threads < 10; threads++) {
		var ava = 0;
		for (var thread = 0; thread < threads; thread++) {
			ava += stp.calculate(threads, thread).availability;
		}
		assert.equal(ava.toFixed(9), expectedAva, "Model " + threads + " threads");
	}
}

QUnit.test( "Ava 1", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.985);
	deviceC.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceB1 = deviceB.newService("b", 100);
	var serviceC1 = deviceC.newService("c", 100);

	serviceA1.addParent(stp.getRootService());
	serviceB1.addParent(stp.getRootService());
	serviceC1.addParent(serviceA1);
	serviceC1.addParent(serviceB1);

	checkCalculate(assert, stp, 0.983030985);
});

QUnit.test( "Ava 2", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.985);
	deviceC.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceB1.addParent(serviceA1);
	serviceB1.addParent(serviceA2);

	checkCalculate(assert, stp, 0.984999015);
});

QUnit.test( "Ava 3", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.985);
	var deviceD = deviceA.newDevice(0.985);
	deviceC.link(deviceB);
	deviceD.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 100);
	var serviceB2 = deviceD.newService("b", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceB1.addParent(serviceA1);
	serviceB1.addParent(serviceA2);
	serviceB2.addParent(serviceA1);
	serviceB2.addParent(serviceA2);

	checkCalculate(assert, stp, 0.999774000);
});

QUnit.test( "Two Services with less than 100% contribution", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.985);
	var deviceD = deviceA.newDevice(0.985);
	deviceC.link(deviceB);
	deviceD.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 50);
	var serviceB2 = deviceD.newService("b", 50);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceB1.addParent(serviceA1);
	serviceB1.addParent(serviceA2);
	serviceB2.addParent(serviceA1);
	serviceB2.addParent(serviceA2);

	checkCalculate(assert, stp, 0.970224030);
});

QUnit.test( "Three Services with less than 100% contribution", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.985);
	var deviceD = deviceA.newDevice(0.985);
	var deviceE = deviceA.newDevice(0.985);
	deviceC.link(deviceB);
	deviceD.link(deviceB);
	deviceE.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 50);
	var serviceB2 = deviceD.newService("b", 50);
	var serviceB3 = deviceE.newService("b", 50);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceB1.addParent(serviceA1);
	serviceB1.addParent(serviceA2);
	serviceB2.addParent(serviceA1);
	serviceB2.addParent(serviceA2);
	serviceB3.addParent(serviceA1);
	serviceB3.addParent(serviceA2);

	checkCalculate(assert, stp, 0.999330751);
});

QUnit.test( "Services spanning a connection device", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = deviceA.newDevice(0.999);

	var serviceB1 = deviceB.newService("b", 100);

	serviceB1.addParent(stp.getRootService());

	checkCalculate(assert, stp, 0.998001);
});

QUnit.test( "Multiple services spanning one connection device", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.999);
	var deviceB = rootDevice.newDevice(0.999);
	var deviceC = deviceA.newDevice(0.980);
	var deviceD = deviceC.newDevice(0.999);
	var deviceE = deviceC.newDevice(0.999);
	deviceC.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceB1 = deviceB.newService("b", 100);
	var serviceD1 = deviceD.newService("d", 100);
	var serviceE1 = deviceE.newService("e", 100);

	serviceA1.addParent(stp.getRootService());
	serviceB1.addParent(stp.getRootService());
	serviceD1.addParent(serviceA1);
	serviceE1.addParent(serviceB1);

	checkCalculate(assert, stp, 0.976085876);
});

QUnit.test( "Redundant services spanning one connection device", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.995);
	var deviceB = rootDevice.newDevice(0.995);
	var deviceC = deviceA.newDevice(0.980);
	var deviceD = deviceC.newDevice(0.999);
	var deviceE = deviceC.newDevice(0.999);
	deviceC.link(deviceB);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceC1 = deviceD.newService("c", 100);
	var serviceC2 = deviceE.newService("c", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceC1.addParent(serviceA1);
	serviceC1.addParent(serviceA2);
	serviceC2.addParent(serviceA1);
	serviceC2.addParent(serviceA2);

	checkCalculate(assert, stp, 0.979974520);
});

QUnit.test( "Complex setup", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.95);
	var deviceB = rootDevice.newDevice(0.95);

	var deviceC = deviceA.newDevice(0.95);
	var deviceD = deviceA.newDevice(0.95);
	deviceC.link(deviceB);
	deviceD.link(deviceB);

	var deviceE = deviceC.newDevice(0.5);
	var deviceF = deviceC.newDevice(0.5);
	var deviceG = deviceC.newDevice(0.5);
	deviceE.link(deviceD);
	deviceF.link(deviceD);
	deviceG.link(deviceD);

	var deviceH = deviceE.newDevice(0.980);
	var deviceI = deviceF.newDevice(0.980);
	var deviceJ = deviceG.newDevice(0.980);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 100);
	var serviceB2 = deviceD.newService("b", 100);
	var serviceC1 = deviceE.newService("c", 100);
	var serviceC2 = deviceF.newService("c", 100);
	var serviceC3 = deviceG.newService("c", 100);
	var serviceD1 = deviceH.newService("d", 100);
	var serviceD2 = deviceI.newService("d", 100);
	var serviceD3 = deviceJ.newService("d", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());	

	serviceB1.addParent(serviceA1);
	serviceB2.addParent(serviceA1);
	serviceB1.addParent(serviceA2);
	serviceB2.addParent(serviceA2);

	serviceC1.addParent(serviceB1);
	serviceC2.addParent(serviceB1);
	serviceC3.addParent(serviceB1);
	serviceC1.addParent(serviceB2);
	serviceC2.addParent(serviceB2);
	serviceC3.addParent(serviceB2);

	serviceD1.addParent(serviceC1);
	serviceD2.addParent(serviceC2);
	serviceD3.addParent(serviceC3);

	checkCalculate(assert, stp, 0.863017676);
});

QUnit.test( "Long interconnected chain", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.995);
	var deviceB = rootDevice.newDevice(0.995);
	var deviceC = deviceA.newDevice(0.980);
	var deviceD = deviceA.newDevice(0.999);
	var deviceE = deviceC.newDevice(0.999);
	var deviceF = deviceC.newDevice(0.999);
	var deviceG = deviceE.newDevice(0.999);
	var deviceH = deviceE.newDevice(0.999);
	deviceC.link(deviceB);
	deviceD.link(deviceB);
	deviceE.link(deviceD);
	deviceF.link(deviceD);
	deviceG.link(deviceF);
	deviceH.link(deviceF);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);
	var serviceB1 = deviceC.newService("b", 100);
	var serviceB2 = deviceD.newService("b", 100);
	var serviceC1 = deviceE.newService("c", 100);
	var serviceC2 = deviceF.newService("c", 100);
	var serviceD1 = deviceE.newService("d", 100);
	var serviceD2 = deviceF.newService("d", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());
	serviceB1.addParent(serviceA1);
	serviceB2.addParent(serviceA1);
	serviceB1.addParent(serviceA2);
	serviceB2.addParent(serviceA2);
	serviceC1.addParent(serviceB1);
	serviceC2.addParent(serviceB1);
	serviceC1.addParent(serviceB2);
	serviceC2.addParent(serviceB2);
	serviceD1.addParent(serviceC1);
	serviceD2.addParent(serviceC1);
	serviceD1.addParent(serviceC2);
	serviceD2.addParent(serviceC2);

	checkCalculate(assert, stp, 0.999954001);
});

QUnit.test( "Many good configurations", function( assert ) {
	var stp = new Ava.Stp();

	var rootDevice = stp.getRootDevice();
	var deviceA = rootDevice.newDevice(0.995);
	var deviceB = rootDevice.newDevice(0.995);
	var deviceC = deviceA.newDevice(0.980);
	var deviceD = deviceA.newDevice(0.999);
	var deviceE = deviceC.newDevice(0.980);
	var deviceF = deviceC.newDevice(0.999);
	var deviceG = deviceE.newDevice(0.999);
	var deviceH = deviceE.newDevice(0.999);
	var deviceI = deviceG.newDevice(0.999);
	var deviceJ = deviceG.newDevice(0.999);
	var deviceK = deviceI.newDevice(0.999);
	var deviceL = deviceI.newDevice(0.999);
	var deviceM = deviceK.newDevice(0.999);
	var deviceN = deviceK.newDevice(0.999);
	deviceC.link(deviceB);
	deviceD.link(deviceB);
	deviceE.link(deviceD);
	deviceF.link(deviceD);
	deviceG.link(deviceF);
	deviceH.link(deviceF);
	deviceI.link(deviceH);
	deviceJ.link(deviceH);
	deviceK.link(deviceJ);
	deviceL.link(deviceJ);
	deviceM.link(deviceL);
	deviceN.link(deviceL);

	var serviceA1 = deviceA.newService("a", 100);
	var serviceA2 = deviceB.newService("a", 100);

	serviceA1.addParent(stp.getRootService());
	serviceA2.addParent(stp.getRootService());

	checkCalculate(assert, stp, 0.999975000);
});
