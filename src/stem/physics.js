const TAU=2*Math.PI;
export function pendulumPeriod(length,g=9.81){
 if(!Number.isFinite(length)||length<=0||!Number.isFinite(g)||g<=0)throw Error('Length and gravity must be positive');
 return TAU*Math.sqrt(length/g);
}
export function pendulumAngle(time,length,amplitude=0.25,g=9.81){
 return amplitude*Math.cos(TAU*time/pendulumPeriod(length,g));
}
export function projectileMetrics(speed,angleDegrees,g=9.81){
 if(!Number.isFinite(speed)||speed<0||!Number.isFinite(g)||g<=0)throw Error('Speed must be nonnegative and gravity positive');
 if(!Number.isFinite(angleDegrees)||angleDegrees<0||angleDegrees>90)throw Error('Angle must be between 0 and 90 degrees');
 const a=angleDegrees*Math.PI/180,vertical=speed*Math.sin(a),flightTime=2*vertical/g;
 return {flightTime,range:speed*Math.cos(a)*flightTime,maxHeight:vertical*vertical/(2*g)};
}
export function projectilePosition(time,speed,angleDegrees,g=9.81){
 const a=angleDegrees*Math.PI/180,metrics=projectileMetrics(speed,angleDegrees,g),t=Math.max(0,Math.min(metrics.flightTime,time));
 return {x:speed*Math.cos(a)*t,y:Math.max(0,speed*Math.sin(a)*t-.5*g*t*t)};
}
export function waveHeight(x,z,time,{frequency,spacing,phase,waveSpeed=3}){
 if(!Number.isFinite(frequency)||frequency<=0||!Number.isFinite(spacing)||spacing<=0||!Number.isFinite(waveSpeed)||waveSpeed<=0)throw Error('Frequency, spacing, and wave speed must be positive');
 const k=TAU*frequency/waveSpeed,omega=TAU*frequency;
 const r1=Math.hypot(x-spacing/2,z),r2=Math.hypot(x+spacing/2,z);
 return .5*(Math.sin(k*r1-omega*time)+Math.sin(k*r2-omega*time+phase));
}
