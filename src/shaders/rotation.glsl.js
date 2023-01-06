export default (objectName) => `
    float angle = position.y * uHitPower;
    mat2 rotateMatrix = get2dRotateMatrix(angle);
    if(position.y > - 0.0) {
        ${objectName}.yz = rotateMatrix * ${objectName}.yz;
    }
`