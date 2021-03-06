/**
 * Original Code
 * https://github.com/toji/gl-matrix/blob/v2.3.2/src/gl-matrix.js
 * Math Util
 * modified by egjs
 */
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.3.2
 */

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

// Some minimal math functionality borrowed from gl-Matrix and stripped down
// for the purposes of this library.

import glMatrix from "./mathUtil/common.js";
import vec3 from "./mathUtil/vec3.js";
import vec2 from "./mathUtil/vec2.js";
import quat from "./mathUtil/quat.js";
import mat4 from "./mathUtil/mat4.js";

function quatToVec3(quaternion) {
	const baseV = vec3.fromValues(0, 0, 1);

	vec3.transformQuat(baseV, baseV, quaternion);
	return baseV;
}

const util = {};

util.isPowerOfTwo = function(n) {
	if (typeof n !== "number") {
		return "Not a number";
	}
	return n && (n & (n - 1)) === 0;
};

util.extractYawFromQuat = function(quaternion) {
	const baseV = quatToVec3(quaternion);

	return 1 * Math.atan2(baseV[0], baseV[2]);
};

util.extractPitchFromQuat = function(quaternion) {
	const baseV = quatToVec3(quaternion);

	return -1 * Math.atan2(
		baseV[1],
		Math.sqrt(Math.pow(baseV[0], 2) + Math.pow(baseV[2], 2)));
};

util.getQuaternionWithYawPitch = function(yaw, pitch) {
	const q = quat.create();

	quat.rotateY(q, q, glMatrix.toRadian(yaw));
	quat.rotateX(q, q, glMatrix.toRadian(pitch));
	return q;
};

util.quatToYawPitch = function(quaternion) {
	return {
		yaw: glMatrix.toDegree(util.extractYawFromQuat(quaternion)),
		pitch: glMatrix.toDegree(util.extractPitchFromQuat(quaternion)),
	};
};

util.yawPitchToPoint = function(yaw, pitch) { // rad, rad
	return [
		Math.tan(yaw) / Math.cos(pitch),
		Math.tan(pitch),
	];
};

// implement reference
// the general equation of a plane : http://www.gisdeveloper.co.kr/entry/평면의-공식
// calculating angle between two vectors : http://darkpgmr.tistory.com/121
const ROTATE_CONSTANT = {
	PITCH_DELTA: 1,
	YAW_DELTA_BY_ROLL: 2,
	YAW_DELTA_BY_YAW: 3,
};

ROTATE_CONSTANT[ROTATE_CONSTANT.PITCH_DELTA] = {
	targetAxis: [0, 1, 0],
	meshPoint: [0, 0, 1],
};
ROTATE_CONSTANT[ROTATE_CONSTANT.YAW_DELTA_BY_ROLL] = {
	targetAxis: [0, 1, 0],
	meshPoint: [1, 0, 0],
};
ROTATE_CONSTANT[ROTATE_CONSTANT.YAW_DELTA_BY_YAW] = {
	targetAxis: [1, 0, 0],
	meshPoint: [0, 0, 1],
};

function getRotationDelta(prevQ, curQ, rotateKind) {
	const targetAxis = vec3.fromValues(
		ROTATE_CONSTANT[rotateKind].targetAxis[0],
		ROTATE_CONSTANT[rotateKind].targetAxis[1],
		ROTATE_CONSTANT[rotateKind].targetAxis[2]
	);
	const meshPoint = ROTATE_CONSTANT[rotateKind].meshPoint;

	const prevQuaternion = quat.clone(prevQ);
	const curQuaternion = quat.clone(curQ);

	quat.normalize(prevQuaternion, prevQuaternion);
	quat.normalize(curQuaternion, curQuaternion);

	let prevPoint = vec3.fromValues(0, 0, 1);
	let curPoint = vec3.fromValues(0, 0, 1);

	vec3.transformQuat(prevPoint, prevPoint, prevQuaternion);
	vec3.transformQuat(curPoint, curPoint, curQuaternion);
	vec3.transformQuat(targetAxis, targetAxis, curQuaternion);

	const rotateDistance = vec3.dot(targetAxis, vec3.cross(vec3.create(), prevPoint, curPoint));
	const rotateDirection = rotateDistance > 0 ? 1 : -1;

	// when counter clock wise, use vec3.fromValues(0,1,0)
	// when clock wise, use vec3.fromValues(0,-1,0)
	// const meshPoint1 = vec3.fromValues(0, 0, 0);
	const meshPoint2 = vec3.fromValues(meshPoint[0], meshPoint[1], meshPoint[2]);

	let meshPoint3;

	if (rotateKind !== ROTATE_CONSTANT.YAW_DELTA_BY_YAW) {
		meshPoint3 = vec3.fromValues(0, rotateDirection, 0);
	} else {
		meshPoint3 = vec3.fromValues(rotateDirection, 0, 0);
	}

	vec3.transformQuat(meshPoint2, meshPoint2, curQuaternion);
	vec3.transformQuat(meshPoint3, meshPoint3, curQuaternion);

	const vecU = meshPoint2;
	const vecV = meshPoint3;
	const vecN = vec3.create();

	vec3.cross(vecN, vecU, vecV);
	vec3.normalize(vecN, vecN);

	const coefficientA = vecN[0];
	const coefficientB = vecN[1];
	const coefficientC = vecN[2];
//	const coefficientD = -1 * vec3.dot(vecN, meshPoint1);

	// a point on the plane
	curPoint = vec3.fromValues(meshPoint[0], meshPoint[1], meshPoint[2]);
	vec3.transformQuat(curPoint, curPoint, curQuaternion);

	// a point should project on the plane
	prevPoint = vec3.fromValues(meshPoint[0], meshPoint[1], meshPoint[2]);
	vec3.transformQuat(prevPoint, prevPoint, prevQuaternion);

	// distance between prevPoint and the plane
	let distance = Math.abs(
		prevPoint[0] * coefficientA +
		prevPoint[1] * coefficientB +
		prevPoint[2] * coefficientC
	);

	const projectedPrevPoint = vec3.create();

	vec3.subtract(projectedPrevPoint, prevPoint, vec3.scale(vec3.create(), vecN, distance));

	let trigonometricRatio =
		(projectedPrevPoint[0] * curPoint[0] +
		projectedPrevPoint[1] * curPoint[1] +
		projectedPrevPoint[2] * curPoint[2]) /
		(vec3.length(projectedPrevPoint) * vec3.length(curPoint));

	// defensive block
	if (trigonometricRatio > 1) {
		trigonometricRatio = 1;
	}

	const theta = Math.acos(trigonometricRatio);

	const crossVec = vec3.cross(vec3.create(), curPoint, projectedPrevPoint);

	distance =
		coefficientA * crossVec[0] +
		coefficientB * crossVec[1] +
		coefficientC * crossVec[2];

	let thetaDirection;

	if (rotateKind !== ROTATE_CONSTANT.YAW_DELTA_BY_YAW) {
		thetaDirection = distance > 0 ? 1 : -1;
	} else {
		thetaDirection = distance < 0 ? 1 : -1;
	}

	const deltaRadian = theta * thetaDirection * rotateDirection;

	return glMatrix.toDegree(deltaRadian);
}

util.getRotationDelta = getRotationDelta;

export {
	util,
	glMatrix,
	mat4,
	quat,
	vec2,
	vec3,
	ROTATE_CONSTANT,
};
