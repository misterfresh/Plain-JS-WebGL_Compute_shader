export class GLTFLoader {
    glcontext;

    static async load(url) {
        const json = await fetch(url).then((response) => response.json());
        const pathArr = url.split('/');
        pathArr.pop();
        const relativePath = pathArr.join('/');

        if (!GLTFLoader.glcontext) {
            GLTFLoader.glcontext = ((document.createElement('canvas')).getContext('webgl'));
        }
        const glcontext = GLTFLoader.glcontext;

        // console.log(json);

        const mesh = json.meshes[0];
        const primitive = mesh.primitives[0];

        const data = {
            primitiveType: PrimitiveType.POINTS,
            numVertices: 0,
            position: null,
            normal: null,
            indices: null
        };

        switch (primitive.mode) {
            case glcontext.POINTS:
                data.primitiveType = PrimitiveType.POINTS;
                break;
            case glcontext.LINES:
                data.primitiveType = PrimitiveType.LINES;
                break;
            case glcontext.TRIANGLES:
                data.primitiveType = PrimitiveType.TRIANGLES;
                break;
            default:
                return data;
        }

        const bufferDataList = await GLTFLoader.loadBuffers(json.buffers, relativePath);
        const accessorsDataList = GLTFLoader.loadAccessors(json.accessors, json.bufferViews, bufferDataList);

        const attributes = primitive.attributes;

        const positionAccessorIndex = attributes.POSITION;
        const positionAccessor = json.accessors[positionAccessorIndex];

        data.numVertices = positionAccessor.count;

        data.position = {
            data: accessorsDataList[positionAccessorIndex],
            num: GLTFLoader.getAccessorTypeSize(positionAccessor.type),
            min: positionAccessor.min,
            max: positionAccessor.max
        };
        // console.log(data);

        if (attributes.hasOwnProperty('NORMAL')) {
            const normalAccessorIndex = attributes.NORMAL;
            data.normal = {
                data: accessorsDataList[normalAccessorIndex],
                num: GLTFLoader.getAccessorTypeSize(json.accessors[normalAccessorIndex].type)
            };
        }

        if (primitive.hasOwnProperty('indices')) {
            const indicesAccessorIndex = primitive.indices;
            data.indices = {
                data: accessorsDataList[indicesAccessorIndex]
            };
        }

        return data;
    }

    static async loadBuffers(buffers, relativePath) {
        const bufferDataList = [];

        const length = buffers.length;
        for (let i = 0; i < length; i++) {
            const buffer = buffers[i];
            const bufferData = await fetch(relativePath + '/' + buffer.uri).then((response) => response.arrayBuffer());
            if (bufferData.byteLength === buffer.byteLength) {
                bufferDataList.push(bufferData);
            }
        }
        return bufferDataList;
    }

    static loadAccessors(accessors, bufferViews, bufferDataList) {
        const accessorsDataList = [];

        const length = accessors.length;
        for (let i = 0; i < length; i++) {
            const accessor = accessors[i];
            const bufferView = bufferViews[accessor.bufferView];
            const bufferData = bufferDataList[bufferView.buffer];
            switch (accessor.componentType) {
                case GLTFLoader.glcontext.BYTE:
                    break;
                case GLTFLoader.glcontext.UNSIGNED_BYTE:
                    break;
                case GLTFLoader.glcontext.SHORT:
                    break;
                case GLTFLoader.glcontext.UNSIGNED_SHORT:
                    const uint16Array = new Uint16Array(bufferData, bufferView.byteOffset + accessor.byteOffset, accessor.count * GLTFLoader.getAccessorTypeSize(accessor.type));
                    accessorsDataList.push(uint16Array);
                    break;
                case GLTFLoader.glcontext.INT:
                    break;
                case GLTFLoader.glcontext.UNSIGNED_INT:
                    break;
                case GLTFLoader.glcontext.FLOAT:
                    const float32Array = new Float32Array(bufferData, bufferView.byteOffset + accessor.byteOffset, accessor.count * GLTFLoader.getAccessorTypeSize(accessor.type));
                    accessorsDataList.push(float32Array);
                    break;
                default:
                    break;
            }
        }
        return accessorsDataList;
    }

    static getAccessorTypeSize(accessorType) {
        let size = 0;
        switch (accessorType) {
            case 'SCALAR':
                size = AccessorType.SCALAR;
                break;
            case 'VEC2':
                size = AccessorType.VEC2;
                break;
            case 'VEC3':
                size = AccessorType.VEC3;
                break;
            case 'VEC4':
                size = AccessorType.VEC4;
                break;
            case 'MAT2':
                size = AccessorType.MAT2;
                break;
            case 'MAT3':
                size = AccessorType.MAT3;
                break;
            case 'MAT4':
                size = AccessorType.MAT4;
                break;
        }
        return size;
    }

    constructor() {
    }
}

const AccessorType = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
}

const PrimitiveType = {
    'POINTS': 'POINTS',
    'LINES': 'LINES',
    'TRIANGLES': 'TRIANGLES'
}
