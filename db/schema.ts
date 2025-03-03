import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export interface Comment {
  commentId?: string,
  seasonId?: string,
  episodeId?: string,
  authorId?: string,
  content?: string,
  pinTimeMs?: number,
  postedTimeMs?: number,
}

export let COMMENT: MessageDescriptor<Comment> = {
  name: 'Comment',
  fields: [{
    name: 'commentId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'seasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'episodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'authorId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'content',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'pinTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'postedTimeMs',
    index: 7,
    primitiveType: PrimitiveType.NUMBER,
  }],
};
