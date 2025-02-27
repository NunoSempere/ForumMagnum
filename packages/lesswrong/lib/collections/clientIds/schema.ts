
const schema: SchemaType<DbClientId> = {
  clientId: {
    type: String,
    canRead: ['sunshineRegiment','admins'],
  },
  firstSeenReferrer: {
    type: String,
    nullable: true,
    canRead: ['sunshineRegiment','admins'],
  },
  firstSeenLandingPage: {
    type: String,
    canRead: ['sunshineRegiment','admins'],
  },
  userIds: {
    type: Array,
    nullable: true,
    canRead: ['sunshineRegiment','admins'],
  },
  'userIds.$': {
    type: String,
    optional: true,
  },
}

export default schema;
