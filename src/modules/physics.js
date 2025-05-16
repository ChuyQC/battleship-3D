export const DEFAULT_MASS = 10;

export function initPhysics() {
  const config    = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher= new Ammo.btCollisionDispatcher(config);
  const broadphase= new Ammo.btDbvtBroadphase();
  const solver    = new Ammo.btSequentialImpulseConstraintSolver();
  const world     = new Ammo.btDiscreteDynamicsWorld(
    dispatcher, broadphase, solver, config
  );
  world.setGravity(new Ammo.btVector3(0, -100, 0));
  return world;
}

export class RigidBody {
  constructor() {}

  setRestitution(val)    { this.body_.setRestitution(val); }
  setFriction(val)       { this.body_.setFriction(val); }
  setRollingFriction(v)  { this.body_.setRollingFriction(v); }

  createBox(mass, pos, quat, size) {
    this.transform_   = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    this.shape_ = new Ammo.btBoxShape(btSize);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) this.shape_.calculateLocalInertia(mass, this.inertia_);

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
      mass, this.motionState_, this.shape_, this.inertia_
    );
    this.body_ = new Ammo.btRigidBody(this.info_);
    Ammo.destroy(btSize);
  }

  createSphere(mass, pos, radius) {
    this.transform_   = new Ammo.btTransform();
    this.transform_.setIdentity();
    this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    this.transform_.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

    this.shape_ = new Ammo.btSphereShape(radius);
    this.shape_.setMargin(0.05);

    this.inertia_ = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) this.shape_.calculateLocalInertia(mass, this.inertia_);

    this.info_ = new Ammo.btRigidBodyConstructionInfo(
      mass, this.motionState_, this.shape_, this.inertia_
    );
    this.body_ = new Ammo.btRigidBody(this.info_);
  }
}
