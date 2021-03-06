import {window} from "../../../src/YawPitchControl/browser";
import TiltMotionInput from "../../../src/YawPitchControl/input/TiltMotionInput";
import TestHeler from "./testHelper";
import {
	CONTROL_MODE_VR,
	CONTROL_MODE_YAWPITCH,
} from "../../../src/YawPitchControl/consts";

const INTERVAL = 1000 / 60.0;

describe("TiltMotionInput", function() {
	describe("#constructor", function() {
		it("Instance", () => {
			// Given
			// When
			this.inst = new TiltMotionInput();

			// Then
			expect(this.inst).to.be.exist;
		});
	});

	describe("change event", function() {
		describe("single key short press", function() {
			let axes = null;
			let moveKeyInput = null;
			let changed = false;
			let deltaYaw = 0;
			let deltaPitch = 0;

			beforeEach(() => {
				moveKeyInput = new TiltMotionInput(document.body, {scale:[1, 1]});
				axes = new Axes({
					yaw: {range: [0, 20]},
					pitch: {range: [0, 20]}
				})
				.on({
					change: e => {
						changed = true;
						deltaYaw = e.delta.yaw;
						deltaPitch = e.delta.pitch;
					}
				}).connect(["yaw", "pitch"], moveKeyInput);
			});

			afterEach(() => {
				axes && axes.destroy();
				moveKeyInput && moveKeyInput.destroy();
				axes = null;
				moveKeyInput = null;
				changed = false;
				deltaYaw = 0;
				deltaPitch = 0;
			});

			
			//// landscape / portrait / landscape -> portrait / portrait -> landscape 총 네벌 수행
			// Yaw 증가, Pitch 변화없음: 절대 Roll 사용, 테이블 위에 눕혀놓고 시계방향으로 돌리기
			// Yaw 감소, Pitch 변화없음 : 절대 Roll 사용, 테이블 위에 눕혀놓고 반시계방향으로 돌리기
			// Yaw 증가, Pitch 변화없음 : Yaw 사용, 수직으로 들고 회전의자위에서 시계방향으로 돌기
			// Yaw 감소, Pitch 변화없음 : Yaw 사용, 수직으로 들고 회전의자위에서 반 시계방향으로 돌기
			// Yaw 증가, Pitch 변화없음 : Yaw 사용, 화면을 아래로 향하게 디바이스를 하늘위로 들고 오른쪽으로 기울이기
			// Yaw 감소, Pitch 변화없음 : Yaw 사용, 화면을 아래로 향하게 디바이스를 하늘위로 들고 왼쪽으로 기울이기			
			// Yaw 변화없음, Pitch 증가 : Pitch 사용, 수직으로 들고 화면을 아래로 향하게 디바이스를 하늘위로 들어올리기
			// Yaw 변화없음, Pitch 감소 : Pitch 사용, 화면을 아래로 향하게 디바이스를 하늘위로 들어올린 상태에서 수직으로 내리기 

			//// 화면회전을 잠그고, 옆으로 누워서
			// Yaw 변화없음, Pitch 증가 : Pitch 사용, 옆으로 누운 상태에서, 디바이스를 윗쪽으로 기울이기
			// Yaw 변화없음, Pitch 감소 : Pitch 사용, 옆으로 누운 상태에서, 디바이스를 아랫쪽으로 기울이기
			// Yaw 증가, Pitch 변화없음 : Yaw 사용, 옆으로 누운 상태에서, 오른쪽으로 기울이기
			// Yaw 감소, Pitch 변화없음 : Yaw 사용, 옆으로 누운 상태에서, 왼쪽으로 기울이기


			// it("should trigger 'change' event to left(keyCode: "+keyCode+")", (done) => {
			// 	// Given
			// 	const leftKeyCode = {
			// 		keyCode: keyCode
			// 	};
			// 	moveKeyInput.options.scale[0] = -1;
				
			// 	// When
			// 	TestHeler.keyDown(document.body, leftKeyCode);
			// 	TestHeler.keyUp(document.body, leftKeyCode);

			// 	// Then
			// 	expect(changed).to.be.true;
			// 	expect(deltaYaw).to.be.equal(1);
			// 	done();
			// });
		});
	});
});
