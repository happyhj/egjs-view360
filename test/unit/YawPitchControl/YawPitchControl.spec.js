import {
	CONTROL_MODE_VR,
	CONTROL_MODE_YAWPITCH,
	TOUCH_DIRECTION_YAW,
	TOUCH_DIRECTION_PITCH,
	TOUCH_DIRECTION_NONE,
	TOUCH_DIRECTION_ALL,
	MC_DECELERATION,
	MAX_FIELD_OF_VIEW
} from "../../../src/YawPitchControl/consts";
import {window} from "../../../src/YawPitchControl/browser";
import YawPitchControl from "../../../src/YawPitchControl/YawPitchControl";
import TestHelper from "./testHelper";
const INTERVAL = 1000 / 60.0;

describe.skip("YawPitchControl", function() {
	describe("constructor", function() {
		describe("default options", function() {
			var target
			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div></div>`;
			});

			afterEach(() => {
				// this.inst && this.inst.destroy();
				// this.inst = null;
			});

			it("Instance without params", () => {
				// Given
				const options = {
					element: target
				};
				// When
				this.inst = new YawPitchControl(options);

				// Then
				expect(this.inst).to.be.exist;
			});

			it("should have default values when options are not given", () => {
				// Given
				const options = {
					element: target
				};
				// When
				this.inst = new YawPitchControl(options);

				// Then
				const appliedOption = this.inst.option();
				expect(appliedOption.yaw).to.equal(0);
				expect(appliedOption.pitch).to.equal(0);
				expect(appliedOption.fov).to.equal(65);
				expect(appliedOption.showPole).to.equal(true);
				expect(appliedOption.useZoom).to.equal(true);
				expect(appliedOption.useKeyboard).to.equal(true);
				expect(appliedOption.touchDirection).to.equal(TOUCH_DIRECTION_ALL);
				expect(appliedOption.yawRange).to.deep.equal([-180, 180]);
				expect(appliedOption.pitchRange).to.deep.equal([-90, 90]);
				expect(appliedOption.fovRange).to.deep.equal([30, 110]);
				expect(appliedOption.aspectRatio).to.equal(1);
			});
		});

		describe("Setting options test that affect each other", function() {
			var target
			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div></div>`;
			});

			it("should change initial yaw by yaw range", function() {
				// Given
				// When
				this.inst = new YawPitchControl({
					element: target,
					yawRange: [30, 180]
				});

				expect(this.inst.getYaw()).to.above(30);
				expect(this.inst.getYaw()).to.below(180);
			});
		});
	});

	describe("enable / diable", function() {
		let target;
		beforeEach(() => {
			target = sandbox();
			target.innerHTML = `<div style="width:300px;height:300px;"></div>`;
			this.inst = new YawPitchControl({
				element: target
			});
		});

		afterEach(() => {
			this.inst && this.inst.destroy();
			target && target.remove();
			target = null;
		});

		it("should disable panning when first place", (done) => {
			// Given
			var callback = sinon.spy();

			setTimeout(() => {
				this.inst.on("change", callback);

				// When
				Simulator.gestures.pan(target, { // this.el 이 300 * 300 이라고 가정
					pos: [30, 30],
					deltaX: 10,
					deltaY: 10,
					duration: 1000,
					easing: "linear"
				}, function() {
					// Then
					expect(callback.called).to.be.false;
					done();
				});
			}, 0);
		});

		it("should trigger change event when panning after enabled", (done) => {
			// Given
			var callback = sinon.spy();
			this.inst.enable();

			setTimeout(() => {
				this.inst.on("change", callback);

				// When
				Simulator.gestures.pan(target, { // this.el 이 300 * 300 이라고 가정
					pos: [30, 30],
					deltaX: 10,
					deltaY: 10,
					duration: 1000,
					easing: "linear"
				}, function() {
					// Then
					expect(callback.called).to.be.true;
					done();
				});
			}, 0);
		});

		it("should not disable lookAt method while disable() method is called", (done) => {
			// Given
			this.inst.on("change", then);

			// When
			this.inst.disable();
			this.inst.lookAt({yaw: 45}, 0);

			// Then
			function then(e) {
				expect(e.yaw).to.equal(45);
				done();
			}
		});

		it("should enable panning on enable mode after disable mode.", (done) => {
			// Given
			const callback = sinon.spy();
			this.inst.on("change", callback);
			this.inst.enable();
			this.inst.disable();
			this.inst.enable();

			// When
			Simulator.gestures.pan(target, {
				pos: [30, 30],
				deltaX: 10,
				deltaY: 10,
				duration: 1000,
				easing: "linear"
			}, function() {
				// Then
				expect(callback.called).to.be.true;
				done();
			});
		});

		it("should lookAt work on enable mode after disable mode.", (done) => {
			// Given
			this.inst.enable();
			this.inst.disable();
			this.inst.enable();

			// When
			/**
			 * enable() makes a "change" event for first rendering
			 * This event does not use it in this case, So here we attach event handler later.
			 */
			this.inst.on("change", then);
			this.inst.lookAt({yaw: 45}, 0);

			// Then
			function then(e) {
				expect(e.yaw).to.equal(45);
				done();
			}
		});
	});

	describe("YawPitch Angle Test", function() {
		// tilt (tilt) 각도의 범위 내에서 움직여야 한다.

		// 두 각도 범위 내에서 움직여야 한다.
		// 옵션 값의 범위가 있는 경우 설정 (최대/최소를 넘어가는 경우 어떻게 설정되는가?)

		// pan (horizontal) 각도의 범위 내에서 움직여야 한다.
		describe("Yaw Range Test", function() {
			let results = [];
			beforeEach(() => {
				this.target = sandbox();
				this.target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				this.inst = new YawPitchControl({
					element: this.target
				});
			});

			afterEach(() => {
				results = [];

				this.target.remove();
				this.inst.destroy();
			});

			// If YAW_DELTA_MAX is useful, then below test is needed.
			// it(`should not update yaw when delta yaw is over ${YawPitch.YAW_DELTA_MAX} degree.`, (done) => {
			// 	// Given
			// 	this.inst.on("change", then);

			// 	// When
			// 	this.inst.lookAt({yaw: YawPitch.YAW_DELTA_MAX + 1}, 0);

			// 	// Then
			// 	function then(e) {
			// 		expect(e.yaw).to.equal(0);
			// 		done();
			// 	}

			// });

			it("should set value as intented in default range", (done) => {
				// Given
				const normals = [10, 170, 0, 180, -10, -150, -180];
				const expected = [10, 170, 0, 180, -10, -150, -180];
				let results = [];

				this.inst.on("change", then);

				// When
				normals.forEach((yaw) => {
					this.inst.lookAt({yaw: yaw}, 0);
				});

				// Then
				function then(e) {
					results.push(e.yaw);

					if (results.length < expected.length) {
						return;
					}
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should set value as corrected in default range when values are out of ranges", (done) => {
				// Given
				const abnormals = [190, -270, -360];
				// const expected = [-170, 90, 0];
				const expected = [-170, 90, 0]; // Is MovableCoord Bug??
				let results = [];

				this.inst.on("change", then);

				// When
				abnormals.forEach((yaw) => {
					this.inst.lookAt({
						yaw: yaw
					}, 0);
				});

				// Then
				function then(e) {
					results.push(e.yaw);

					if (results.length < expected.length) {
						return;
					}

					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should set value in ranges when yaw ranges are specified", (done) => {
				// Given
				const yaws = [-180, -90, 0, 80, 190];
				const firstYawMin = this.inst._movableCoord.option("min")[0];
				const firstYawMax = this.inst._movableCoord.option("max")[0];

				// When
				// this.inst.on("change", onChanged);
				// Setting yawRange changes yawMin/Max
				this.inst.option("yawRange", [-90, 70]);
				const yawMin = this.inst._movableCoord.option("min")[0];
				const yawMax = this.inst._movableCoord.option("max")[0];
				// Nearest boundary value
				//
				const expected = [yawMin, yawMin, 0, yawMax, yawMax];
				// console.debug(firstYawMin, firstYawMax, yawMin, yawMax);
				TestHelper.asyncLoop(yaws.length, (i, asyncDone) => {
					this.inst.lookAt({yaw: yaws[i]}, 0);

					setTimeout(() => {
						// console.debug("lookAt result", this.inst._yaw);
						results.push(this.inst._yaw);
						asyncDone();
					}, 100);
				}, function() {
					//Then
					// console.debug(yawMin, firstYawMin, yawMax, firstYawMax, results);
					expect(yawMin).to.not.equal(firstYawMin);
					expect(yawMax).to.not.equal(firstYawMax);
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				});
			});

			it("should does not set yaw range if yaw range is invalid.", () => {
				// Given
				// Yaw ranges are too narrow relative to fov.
				const yawRanges = [[10, 30], [-10, 30], [-30, -10]];
				let expected = [];
				let resultYaws = [];

				// When
				yawRanges.forEach((range) => {
					expected.push(this.inst.option("yawRange"));
					this.inst.option("yawRange", range);
					resultYaws.push(this.inst.option("yawRange"));
				})

				// Then
				expected.forEach((val, i) => {
					expect(resultYaws[i]).to.equal(val);
				});
			});

			it("should set yaw in range when default yaw is out of range.", (done) => {
				// Given
				const yawRanges = [[10, 180], [-180, 10], [30, 200]];
				const expected = [];
				// let prevYaws = [];
				let resultYaws = [];

				this.inst.on("change", then);

				// When
				yawRanges.forEach((range) => {
					this.inst.option("yawRange", range);
				});

				function then(e) {
					results.push(e.yaw);

					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should returns specific value when yaw range has 1 value", (done) => {
				// Given
				const yaws = [-180, -90, 0, 80, 190];
				const horizontalFov = this.inst.option("fov") * 1;
				const expectedYaws = horizontalFov / 2;
				const expected = [expectedYaws, expectedYaws, expectedYaws, expectedYaws, expectedYaws];

				// When
				this.inst.option("yawRange", [0, horizontalFov]);// Range has 1 value
				this.inst.on("change", then);

				yaws.forEach((yaw) => {
					this.inst.lookAt({
						yaw: yaw
					}, 0);
				});

				function then(e) {
					results.push(e.yaw);

					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			// TODO [20, -20] 과 같이 순서가 맞지 않는 경우를 허용해야 하는가?
			it("should consider range in order when range is inverted ", () => {
				// Given
				// 190 -> 180
				// When

				// Then
			});

			// // VR 모드에서의 범위 테스트가 별도로 필요한가?
			// it("VR Mode??", () => {
			// 	// Given
			// 	// When
			// 	this.inst.option("yawRange", []);
			// 	// Then
			// 	//this.inst.options
			// 	// TODO: data.expected 와 옵션값을 비교하는 코드를 넣는다.
			// });
		});

		// 옵션 값의 범위가 있는 경우 설정 (최대/최소를 넘어가는 경우 어떻게 설정되는가?)
		describe("Pitch Range Test", function() {
			beforeEach(() => {
				this.target = sandbox();
				this.target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				this.inst = new YawPitch({
					element: this.target
				});
			});

			afterEach(() => {
				this.target.remove();
				this.inst.destroy();
			});

			it("should set pitch in default pitch range.", (done) => {
				// Given
				const pitches = [-180, -120, 30, 90, 360];
				const expected = [-90, -90, 30, 90, 90];
				let results = [];

				// When
				this.inst.on("change", then);

				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				function then(e) {
					results.push(e.pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should set intended pitch in specified range.", (done) => {
				// -35 ~ +35
				// Given
				// When
				const pitches = [-180, -40, 0, 30, 90, 360];
				let results = [];

				this.inst.on("change", then);
				this.inst.option("pitchRange", [-35, 35]);
				const min =  this.inst._movableCoord.option("min")[1];
				const max =  this.inst._movableCoord.option("max")[1];
				const expected = [min, min, 0, max, max, max];

				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				function then(e) {
					results.push(e.pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should set specific pitch when pitch range has 1 value.", (done) => {
				// Given
				const pitches = [-180, -30, 30, 90, 360];
				let results = [];
				const expected = [32.5, 32.5, 32.5, 32.5, 32.5];

				// When
				this.inst.option("pitchRange", [0, 65]);
				this.inst.on("change", then);

				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				function then(e) {
					results.push(e.pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});

					done();
				}
			});

			it("should return pole excluded pitches when showPolePoint is false", (done) => {
				// Given
				const pitches = [-90, -57.5, 30, 57.5, 360];
				// Second parameter -57.5 doesn't fire event.
				const expected = [-57.5, 30, 57.5, 57.5];
				let results = [];

				// When
				this.inst.on("change", then);
				this.inst.option("showPolePoint", false);
				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				function then(e) {
					results.push(e.pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			it("should return pitches in pitchRange when showPolePoint is false and min/max range is smaller than pole range", (done) => {
				// Given
				const pitches = [-90, -30, 0, 30, 360];
				const expected = [-10, -10, 0, 10, 10];
				let results = [];

				// When
				this.inst.option("showPolePoint", false);
				this.inst.option("pitchRange", [-42.5, 42.5]);
				this.inst.on("change", then);
				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				// Then
				function then(e) {
					results.push(e.pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					expected.forEach((val, i) => {
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});

			/**
			 * VR MODE
			 *
			 * Does lookAt({pitch}) need to be ignored?
			 * It need to be supported by MovableCoord!
			 */
			it.skip("should not change the pitch in VR MODE", (done) => {
				// Given
				const pitches = [-90, -30, 0, 30, 360];
				const expected = [0, 0, 0, 0, 0];
				let results = [];
				let self = this;

				// When
				this.inst.on("change", then);
				this.inst.option("controlMode", CONTROL_MODE_VR);
				pitches.forEach((pitch) => {
					this.inst.lookAt({
						pitch: pitch
					}, 0);
				});

				// Then
				function then(e) {
					results.push(self.inst._pitch);
					if (results.length < expected.length) {
						return;
					}

					// Then
					// console.debug("expected", expected);
					expected.forEach((val, i) => {
						// console.debug(i, results[i], val);
						expect(results[i]).to.equal(val);
					});
					done();
				}
			});
		});
	});

	describe.skip("FOV Test", function() {
		describe("Min/Max FOV", function() {
			let inst;
			let target;
			let results = [];

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				target.remove();
				inst.destroy();
			});

			// It this test need?
			it("should set `fov-range` in certain range", () => {
				// Given
				this.inputValues = [
					[60, 110], [30, 110], [0, 110], [-30, 110], [-60, 110],/* min test */
					[30, 30], [30, 90], [30, 150], [30, 210], [30, 270] /* max text */
				];
				// TODO: Is need to throw errors on exceptional range?
				this.expectedValues = [
					[60, 110], [30, 110], [0, 110], [-30, 110], [-60, 110],/* min test */
					[30, 30], [30, 90], [30, 150], [30, 210], [30, 270] /* max text */
				];

				// When
				this.inputValues.forEach((range) => {
					inst.option("fovRange", range);

					results.push(inst.option("fovRange"));
				});

				// Then
				this.expectedValues.forEach((expectedVal, i) => {
					expect(results[i]).to.be.eql(expectedVal);
				});
			});
		});

		describe("FOV setting within FOV Range", function() {
			let results = [];
			let inst = null;
			let target;
			let attachThenHandler = (expected, done) => {
				inst.on("change", e => {
					results.push(e.fov);
					if (results.length < expected.length) {
						return;
					}
					done && done.call(this, results);
				});
			};

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				inst.destroy();
				target.remove();
			});

			it("should set fov within fov-range", (done) => {
				// Given
				const inputFov = [-10, 0, 40, 90, 120, 200];
				const expectedFov = [30, 30, 40, 90, 110, 110];

				attachThenHandler(expectedFov, then);

				// When
				inputFov.forEach((fov) => {
					inst.lookAt({fov: fov}, 0);
				});

				// Then
				function then(res) {
					expectedFov.forEach((expectedVal, i) => {
						expect(res[i]).to.equal(expectedVal);
					});

					done();
				}
			});

			it("should set fov within user defined fov-range", (done) => {
				// Given
				const inputFov = [-10, 0, 25, 30, 60, 120];
				const expected = [20, 20, 25, 30, 60, 60];

				// When
				inst.option("fovRange", [20, 60]);
				attachThenHandler(expected, then);

				inputFov.forEach((fov) => {
					inst.lookAt({
						fov: fov
					}, 0);
				});

				// Then
				function then(res) {
					console.debug("fov range:", res);
					expected.forEach((expectedVal, i) => {
						expect(res[i]).to.equal(expectedVal);
					});

					done();
				}
			});
		});

		describe("Pitch Min/Max update by FOV Change", function() {
			let results = [];
			let inst = null;
			let target;

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				target.remove();
				inst.destroy();
			});

			it("should update pitchMin/Max when FOV changed", function() {
				// Given
				inst.option("showPolePoint", false);
				let pitchMin = inst._movableCoord.option("min")[1];
				let pitchMax = inst._movableCoord.option("max")[1];
				const firstPitchRange = [pitchMin, pitchMax];

				// When
				// It is valid when showPolePoint is false or isPanorama
				inst.lookAt({fov: 30}); //fov: 65 -> 30

				pitchMin = inst._movableCoord.option("min")[1];
				pitchMax = inst._movableCoord.option("max")[1];
				const lastPitchRange = [pitchMin, pitchMax];

				// Then
				expect(lastPitchRange[0]).to.be.below(firstPitchRange[0]);
				expect(lastPitchRange[1]).to.be.above(firstPitchRange[1]);
			});

			it("should update current pitch when 'changed fov' cannot accept current pitch", function(done) {
				// Given
				const firstPitch = 57.5;

				// When
				// It is valid when showPolePoint is false or isPanorama
				inst.option("showPolePoint", false);
				inst.lookAt({pitch: firstPitch});//57.5 is current pitchMax

				// This makes pitchMax to be updated to value which is below current pitch(57.5)
				inst.on("change", changed);
				inst.lookAt({fov:90}); //_pitchMin/Max = [-45, 45]

				function changed(e) {
					// Then
					expect(e.pitch).to.be.below(firstPitch);
					done();
				}
			});
		});

		describe("Deceleration update by FOV Change", function() {
			let results = [];
			let inst = null;
			let target;
			let attachThenHandler = (expected, then) => {
				inst.on("change", e => {
					const deceleration = inst._movableCoord.option("deceleration");
					results.push(deceleration);
					if (results.length < expected.length) {
						return;
					}
					then && then.call(this, results);
				});
			};

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				target.remove();
				inst.destroy();
			});

			it("should update deceleration when FOV changed", function(done) {
				// Given
				const inputFov = [30, 60, 100]; // Valid fov range
				const expected = inputFov.map(fov => MC_DECELERATION * fov / MAX_FIELD_OF_VIEW);

				attachThenHandler(expected, then);
				// When
				inputFov.forEach(fov => {
					inst.lookAt({fov});
				})

				// Then
				function then(res) {
					expected.forEach((expectedVal, i) => {
						expect(res[i]).to.equal(expectedVal);
					});

					done();
				}
			});
		});

		describe("useZoom false Test", () => {
			let results = [];
			let inst = null;
			let target;
			let attachThenHandler = (expected, done) => {
				inst.on("change", e => {
					results.push(e.fov);
					if (results.length < expected.length) {
						return;
					}
					done && done.call(this, results);
				});
			};

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				target.remove();
				inst.destroy();
			});

			// allow FOV (Zoom) (Spec for embedding in a document)
			it("should change fov although useZoom is false", () => {
				// Given
				var fovs = [60, 90, 30];
				var expected = [60, 90, 30];

				// When
				inst.option("useZoom", false);
				attachThenHandler(expected, then);
				fovs.forEach((fov) => {
					inst.lookAt({
						fov: fov
					}, 0);
				});

				// Then
				function then(res) {
					expected.forEach((expectedVal, i) => {
						expect(res[i]).to.equal(expectedVal);
					});
				}

			});
		});

		describe("PinchZoom Test", ()=> {
			let results = [];
			let inst = null;
			let target;
			let attachThenHandler = (expected, done) => {
				inst.on("change", e => {
					results.push(e.fov);
					if (results.length < expected.length) {
						return;
					}
					done && done.call(this, results);
				});
			}

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:300px;height:300px;"></div>`;

				inst = new YawPitch({element: target});
			});

			afterEach(() => {
				results = [];
				target.remove();
				inst.destroy();
			});

			it("should increase fov using pinchZoom if useZoom is true", (done) => {
				// Given
				let firstFov = inst._fov;
				inst.option("useZoom", true);

				// When
				Simulator.gestures.pinch(target, {
					scale: 0.5
				}, function() {
					// Then
					expect(inst._fov).to.be.above(firstFov);
					done();
				});
			});

			it("should decrease fov using pinchZoom if useZoom is true", (done) => {
				// Given
				let firstFov = inst._fov;
				inst.option("useZoom", true);

				// When
				Simulator.gestures.pinch(target, {
					scale: 2
				}, function() {
					// Then
					expect(inst._fov).to.be.below(firstFov);
					done();
				});
			});

			it("should not change fov using pinchZoom if useZoom is false", (done) => {
				// Given
				let firstFov = inst._fov;
				inst.option("useZoom", false);

				// When
				Simulator.gestures.pinch(target, {
					scale: 2
				}, function() {
					// Then
					expect(inst._fov).to.be.equal(firstFov);
					done();
				});
			});

			// useZoom false 인 경우 pinch zoom 이 동작하지 않아야 한다.
			it("should change fov using pinchZoom if useZoom is followed by true", (done) => {
				// Given
				let firstFov = inst._fov;
				inst.option("useZoom", false);

				// When
				inst.option("useZoom", true);
				Simulator.gestures.pinch(target, {
					scale: 2
				}, function() {
					// Then
					expect(inst._fov).to.be.below(firstFov);
					done();
				});
			});

			it("should not change fov using pinchZoom if useZoom is false on constructor", (done) => {
				// Given
				inst.destroy();
				inst = new YawPitch({
					element: target,
					useZoom: false,
				});

				let firstFov = inst._fov;

				// When
				Simulator.gestures.pinch(target, {
					scale: 2
				}, function() {
					// Then
					expect(inst._fov).to.be.equal(firstFov);
					done();
				});
			});
		});

		describe("Wheel Test", ()=> {
			let inst = null;
			let lastFov;
			let changed = false;
			let target;

			beforeEach(() => {
				target = sandbox();
				target.innerHTML = `<div style="width:100px;height:100px;"></div>`;
				inst = new YawPitch({element: target});

				inst.on("change", (e) => {
					lastFov = e.fov;
					changed = true;
				});
			});

			afterEach(() => {
				inst.destroy();
				target.remove();
				changed = false;
			});

			// useZoom true 인 경우 wheel scroll 을 통한 확대가 가능해야 한다.
			it("should increase fov using wheelScroll if useZoom is true", () => {
				// Given
				let firstFov = inst.getFov();
				inst.option("useZoom", true);

				// When
				// wheel scroll up
				TestHelper.wheelVertical(target, 100, () => {
					// Then
					expect(lastFov).to.be.above(firstFov);
				});
			});

			// useZoom true 인 경우 wheel scroll 을 통한 축소가 가능해야 한다.
			it("should decrease fov using wheelScroll if useZoom is true", () => {
				// Given
				let firstFov = inst.getFov();
				inst.option("useZoom", true);

				// When
				// wheel scroll down
				TestHelper.wheelVertical(target, -100, () => {
					// Then
					expect(lastFov).to.be.below(firstFov);
				});
			});

			// useZoom true 인 경우 wheel scroll 을 통한 확대가 불가능해야 한다.
			it("should not increase fov using wheelScroll if useZoom is false", () => {
				// Given
				let firstFov = inst.getFov();
				inst.option("useZoom", false);

				// When
				// wheel scroll up
				TestHelper.wheelVertical(target, 100, () => {
					// Then
					expect(changed).to.be.equal(false);
				});
			});

			// useZoom true 인 경우 wheel scroll 을 통한 축소가 불가능해야 한다.
			it("should not decrease fov using wheelScroll if useZoom is false", () => {
				// Given
				let firstFov = inst.getFov();
				inst.option("useZoom", false);

				// When
				// wheel scroll down
				TestHelper.wheelVertical(target, -100, () => {
					// Then
					expect(changed).to.be.equal(false);
				});
			});

		});
	});

	describe.skip("Option Change Test", function() {
		let inst = null;
		let target;

		beforeEach(() => {
			target = sandbox();
			target.innerHTML = `<div style="width:100px;height:100px;"></div>`;
			inst = new YawPitch({element: target});
		});

		afterEach(() => {
			inst.destroy();
		});

		// showPolePoint, controlMode, useZoom,
		it("should change controlMode", function() {
			// Given
			// When
			inst.option("controlMode", CONTROL_MODE_VR);

			// Then
			const cm1 = inst._deviceOrientationControls.option("controlMode");
			const cm2 = inst.option("controlMode");

			expect(cm1).to.be.equal(CONTROL_MODE_VR);
			expect(cm2).to.be.equal(CONTROL_MODE_VR);
		});

		// showPolePoint, controlMode, useZoom,
		it("should change touchDirection", function() {
			// Given
			const inputDirection = [
				TOUCH_DIRECTION_YAW,
				TOUCH_DIRECTION_PITCH,
				TOUCH_DIRECTION_NONE,
				TOUCH_DIRECTION_ALL
			];
			const expectedDirection = inputDirection.map(dir => YawPitch.getControlDirection(dir));
			let resultDir = [];

			// When
			inputDirection.forEach(dir => {
				inst.option("touchDirection", dir);
				resultDir.push(inst._movableCoord._hammerManager.get(target).options.direction);
			});

			// Then
			resultDir.forEach((result, i) => {
				expect(result).to.equal(expectedDirection[i]);
			});
		});
	});
});
