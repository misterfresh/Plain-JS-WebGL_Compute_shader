// ComputeShader source
// language=GLSL
export default function getComputeShader (WORK_GROUP_SIZE){ return `#version 310 es
layout (local_size_x = ${WORK_GROUP_SIZE}, local_size_y = 1, local_size_z = 1) in;
#define SEPARATE_RANGE 1.0
#define ALIGNMENT_RANGE 2.0
#define COHESION_RANGE 2.0
#define MAX_SPEED 5.0
#define MAX_STEER_FORCE 0.5
#define AVOID_WALL_WEIGHT 10.0
#define DELTA_TIME 0.05

layout (std140) uniform Uniforms {
    float separateWeight;
    float alignmentWeight;
    float cohesionWeight;
} uniforms;

struct Boids {
    vec3 position;
    vec3 velocity;
};
layout (std140, binding = 0) buffer SSBOIn {
    Boids data[];
} ssboIn;
layout (std140, binding = 1) buffer SSBOOut {
    Boids data[];
} ssboOut;
shared Boids sharedData[${WORK_GROUP_SIZE}];

vec3 limit(vec3 vec, float max) {
    float length = length(vec);
    return (length > max && length > 0.0) ? vec * max / length : vec;
}

vec3 avoidWall(vec3 position) {
    vec3 wc = vec3(0.0);
    vec3 ws = vec3(64.0);
    vec3 acc = vec3(0.0);

    acc.x = (position.x < wc.x - ws.x * 0.5) ? acc.x + 1.0 : acc.x;
    acc.x = (position.x > wc.x + ws.x * 0.5) ? acc.x - 1.0 : acc.x;
    acc.y = (position.y < wc.y - ws.y * 0.5) ? acc.y + 1.0 : acc.y;
    acc.y = (position.y > wc.y + ws.y * 0.5) ? acc.y - 1.0 : acc.y;
    acc.z = (position.z < wc.z - ws.z * 0.5) ? acc.z + 1.0 : acc.z;
    acc.z = (position.z > wc.z + ws.z * 0.5) ? acc.z - 1.0 : acc.z;
    return acc;
}

void main() {
    uint threadIndex = gl_GlobalInvocationID.x;
    //ssboOut.data[threadIndex].position = ssboIn.data[threadIndex].position + ssboIn.data[threadIndex].velocity;

    Boids boids = ssboIn.data[threadIndex];
    vec3 position = boids.position;
    vec3 velocity = boids.velocity;

    vec3 separetePositionSum = vec3(0.0);
    int separeteCount = 0;

    vec3 alignmentVelocitySum = vec3(0.0);
    int alignmentCount = 0;

    vec3 cohesionPositionSum = vec3(0.0);
    int cohesionCount = 0;

    for(uint j = 0u; j < gl_WorkGroupSize.x; j++) {
        uint offset = j * gl_WorkGroupSize.x;
        sharedData[gl_LocalInvocationID .x] = ssboIn.data[offset + gl_LocalInvocationID .x];
        memoryBarrierShared();
        barrier();
        for(uint i = 0u; i < gl_WorkGroupSize.x; i++) {
            Boids targetBoids = sharedData[i];
            vec3 targetPosition = targetBoids.position;
            vec3 targetVelocity = targetBoids.velocity;

            vec3 diff = position - targetPosition;
            float dist = length(diff);

            if(dist > 0.0 && dist <= SEPARATE_RANGE) {
                vec3 repluse = normalize(diff);
                repluse /= dist;
                separetePositionSum += repluse;
                separeteCount++;
            }

            if(dist > 0.0 && dist <= ALIGNMENT_RANGE) {
                alignmentVelocitySum += targetVelocity;
                alignmentCount++;
            }

            if(dist > 0.0 && dist <= COHESION_RANGE) {
                cohesionPositionSum += targetPosition;
                cohesionCount++;
            }
        }
        barrier();
    }

    vec3 separeteSteer = vec3(0.0);
    if(separeteCount > 0) {
        separeteSteer = separetePositionSum / float(separeteCount);
        separeteSteer = normalize(separeteSteer) * MAX_SPEED;
        separeteSteer = separeteSteer - velocity;
        separeteSteer = limit(separeteSteer, MAX_STEER_FORCE);
    }

    vec3 alignmentSteer = vec3(0.0);
    if(alignmentCount > 0) {
        alignmentSteer = alignmentVelocitySum / float(alignmentCount);
        alignmentSteer = normalize(alignmentSteer) * MAX_SPEED;
        alignmentSteer = alignmentSteer - velocity;
        alignmentSteer = limit(alignmentSteer, MAX_STEER_FORCE);
    }

    vec3 cohesionSteer = vec3(0.0);
    if(cohesionCount > 0) {
        cohesionPositionSum = cohesionPositionSum / float(cohesionCount);
        cohesionSteer = cohesionPositionSum - position;
        cohesionSteer = normalize(cohesionSteer) * MAX_SPEED;
        cohesionSteer = cohesionSteer - velocity;
        cohesionSteer = limit(cohesionSteer, MAX_STEER_FORCE);
    }
    vec3 force = separeteSteer * uniforms.separateWeight;
    force += alignmentSteer * uniforms.alignmentWeight;
    force += cohesionSteer * uniforms.cohesionWeight;

    force += avoidWall(position) * AVOID_WALL_WEIGHT;

    vec3 newVelocity = velocity + force * DELTA_TIME;
    newVelocity = limit(newVelocity, MAX_SPEED);
    ssboOut.data[threadIndex].velocity = newVelocity;
    ssboOut.data[threadIndex].position = position + newVelocity * DELTA_TIME;
}`}

