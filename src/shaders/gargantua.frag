precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uMass;
uniform float uAccretionRate;
uniform float uDiskTemp;
uniform float uInclination;
uniform float uDoppler;
uniform float uExposure;

#define PI 3.14159265359
#define MAX_STEPS 128
#define MAX_DIST 50.0

float rs(float M) { return 2.0 * M; }

float diskTemp(float r, float M, float T0) {
  float r_ms = 6.0 * M;
  if (r < r_ms) return 0.0;
  return T0 * pow(r_ms / r, 0.75);
}

vec3 blackbody(float T) {
  float t = T / 1000.0;
  vec3 c = vec3(0.0);
  c.r = 1.0 / (1.0 + exp(-(t - 4.0)));
  c.g = 1.0 / (1.0 + exp(-(t - 6.0) * 1.5));
  c.b = 1.0 / (1.0 + exp(-(t - 8.0) * 2.0));
  return c * T * T * T * T * 0.0001;
}

vec3 rayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 forward = normalize(camTarget - camPos);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  return normalize(uv.x * right + uv.y * up + 1.5 * forward);
}

vec3 bendRay(vec3 ro, vec3 rd, float M, float stepSize) {
  vec3 toCenter = -ro;
  float dist = length(toCenter);
  float force = (1.5 * rs(M) * stepSize) / (dist * dist);
  return normalize(rd + toCenter / dist * force);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float M = uMass;
  float R_s = rs(M);
  vec3 camPos = vec3(0.0, uInclination * 0.3 + 0.1, -8.0 * M);
  vec3 rd = rayDir(uv, camPos, vec3(0.0));
  vec3 ro = camPos;
  vec3 col = vec3(0.0);
  float glow = 0.0;
  float t = 0.0;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float dist = length(p);
    if (dist < R_s * 1.05) break;

    float diskInner = 3.0 * R_s;
    float diskOuter = 20.0 * R_s;
    float diskHeight = 0.3 * M;

    if (abs(p.y) < diskHeight && dist > diskInner && dist < diskOuter) {
      float temp = diskTemp(dist, M, uDiskTemp);
      float doppler = 1.0 + uDoppler * (p.x / dist) * 0.5;
      vec3 emit = blackbody(temp * doppler);
      float alpha = smoothstep(diskHeight, 0.0, abs(p.y)) * 0.8;
      col += emit * alpha * (1.0 - col.r);
      glow += alpha * 0.1;
    }

    float lens = R_s / dist;
    glow += lens * lens * 0.02;
    float stepSize = max(0.05 * dist, 0.01);
    t += stepSize;
    rd = bendRay(p, rd, M, stepSize);
    if (t > MAX_DIST) break;
  }

  col += vec3(1.0, 0.6, 0.2) * glow * 0.5;
  float stars = pow(max(sin(uv.x * 437.0) * sin(uv.y * 317.0), 0.0), 20.0);
  col += vec3(0.8, 0.9, 1.0) * stars * 0.3;
  col *= 1.0 + uv.x * uDoppler * 0.3;
  col = col * uExposure / (1.0 + col * uExposure);
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(col, 1.0);
}
