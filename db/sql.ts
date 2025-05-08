import { Spanner, Database, Transaction } from '@google-cloud/spanner';
import { Statement } from '@google-cloud/spanner/build/src/transaction';
import { PrimitiveType, MessageDescriptor } from '@selfage/message/descriptor';

export function insertCommentStatement(
  args: {
    commentId: string,
    seasonId?: string,
    episodeId?: string,
    authorId?: string,
    content?: string,
    pinnedTimeMs?: number,
    postedTimeMs?: number,
  }
): Statement {
  return {
    sql: "INSERT Comment (commentId, seasonId, episodeId, authorId, content, pinnedTimeMs, postedTimeMs) VALUES (@commentId, @seasonId, @episodeId, @authorId, @content, @pinnedTimeMs, @postedTimeMs)",
    params: {
      commentId: args.commentId,
      seasonId: args.seasonId == null ? null : args.seasonId,
      episodeId: args.episodeId == null ? null : args.episodeId,
      authorId: args.authorId == null ? null : args.authorId,
      content: args.content == null ? null : args.content,
      pinnedTimeMs: args.pinnedTimeMs == null ? null : Spanner.float(args.pinnedTimeMs),
      postedTimeMs: args.postedTimeMs == null ? null : Spanner.float(args.postedTimeMs),
    },
    types: {
      commentId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      authorId: { type: "string" },
      content: { type: "string" },
      pinnedTimeMs: { type: "float64" },
      postedTimeMs: { type: "float64" },
    }
  };
}

export function deleteCommentStatement(
  args: {
    commentCommentIdEq: string,
  }
): Statement {
  return {
    sql: "DELETE Comment WHERE (Comment.commentId = @commentCommentIdEq)",
    params: {
      commentCommentIdEq: args.commentCommentIdEq,
    },
    types: {
      commentCommentIdEq: { type: "string" },
    }
  };
}

export interface GetCommentRow {
  commentCommentId?: string,
  commentSeasonId?: string,
  commentEpisodeId?: string,
  commentAuthorId?: string,
  commentContent?: string,
  commentPinnedTimeMs?: number,
  commentPostedTimeMs?: number,
}

export let GET_COMMENT_ROW: MessageDescriptor<GetCommentRow> = {
  name: 'GetCommentRow',
  fields: [{
    name: 'commentCommentId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentAuthorId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentContent',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentPinnedTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'commentPostedTimeMs',
    index: 7,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function getComment(
  runner: Database | Transaction,
  args: {
    commentCommentIdEq: string,
  }
): Promise<Array<GetCommentRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.commentId, Comment.seasonId, Comment.episodeId, Comment.authorId, Comment.content, Comment.pinnedTimeMs, Comment.postedTimeMs FROM Comment WHERE (Comment.commentId = @commentCommentIdEq)",
    params: {
      commentCommentIdEq: args.commentCommentIdEq,
    },
    types: {
      commentCommentIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetCommentRow>();
  for (let row of rows) {
    resRows.push({
      commentCommentId: row.at(0).value == null ? undefined : row.at(0).value,
      commentSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      commentEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      commentAuthorId: row.at(3).value == null ? undefined : row.at(3).value,
      commentContent: row.at(4).value == null ? undefined : row.at(4).value,
      commentPinnedTimeMs: row.at(5).value == null ? undefined : row.at(5).value.value,
      commentPostedTimeMs: row.at(6).value == null ? undefined : row.at(6).value.value,
    });
  }
  return resRows;
}

export interface ListCommentsOfEpisodeRow {
  commentCommentId?: string,
  commentSeasonId?: string,
  commentEpisodeId?: string,
  commentAuthorId?: string,
  commentContent?: string,
  commentPinnedTimeMs?: number,
  commentPostedTimeMs?: number,
}

export let LIST_COMMENTS_OF_EPISODE_ROW: MessageDescriptor<ListCommentsOfEpisodeRow> = {
  name: 'ListCommentsOfEpisodeRow',
  fields: [{
    name: 'commentCommentId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentAuthorId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentContent',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentPinnedTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'commentPostedTimeMs',
    index: 7,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function listCommentsOfEpisode(
  runner: Database | Transaction,
  args: {
    commentSeasonIdEq?: string,
    commentEpisodeIdEq?: string,
    commentPinnedTimeMsGe?: number,
    commentPinnedTimeMsLt?: number,
  }
): Promise<Array<ListCommentsOfEpisodeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.commentId, Comment.seasonId, Comment.episodeId, Comment.authorId, Comment.content, Comment.pinnedTimeMs, Comment.postedTimeMs FROM Comment WHERE (Comment.seasonId = @commentSeasonIdEq AND Comment.episodeId = @commentEpisodeIdEq AND Comment.pinnedTimeMs >= @commentPinnedTimeMsGe AND Comment.pinnedTimeMs < @commentPinnedTimeMsLt) ORDER BY Comment.pinnedTimeMs",
    params: {
      commentSeasonIdEq: args.commentSeasonIdEq == null ? null : args.commentSeasonIdEq,
      commentEpisodeIdEq: args.commentEpisodeIdEq == null ? null : args.commentEpisodeIdEq,
      commentPinnedTimeMsGe: args.commentPinnedTimeMsGe == null ? null : Spanner.float(args.commentPinnedTimeMsGe),
      commentPinnedTimeMsLt: args.commentPinnedTimeMsLt == null ? null : Spanner.float(args.commentPinnedTimeMsLt),
    },
    types: {
      commentSeasonIdEq: { type: "string" },
      commentEpisodeIdEq: { type: "string" },
      commentPinnedTimeMsGe: { type: "float64" },
      commentPinnedTimeMsLt: { type: "float64" },
    }
  });
  let resRows = new Array<ListCommentsOfEpisodeRow>();
  for (let row of rows) {
    resRows.push({
      commentCommentId: row.at(0).value == null ? undefined : row.at(0).value,
      commentSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      commentEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      commentAuthorId: row.at(3).value == null ? undefined : row.at(3).value,
      commentContent: row.at(4).value == null ? undefined : row.at(4).value,
      commentPinnedTimeMs: row.at(5).value == null ? undefined : row.at(5).value.value,
      commentPostedTimeMs: row.at(6).value == null ? undefined : row.at(6).value.value,
    });
  }
  return resRows;
}

export interface ListCommentsByPostedTimeRow {
  commentCommentId?: string,
  commentSeasonId?: string,
  commentEpisodeId?: string,
  commentAuthorId?: string,
  commentContent?: string,
  commentPinnedTimeMs?: number,
  commentPostedTimeMs?: number,
}

export let LIST_COMMENTS_BY_POSTED_TIME_ROW: MessageDescriptor<ListCommentsByPostedTimeRow> = {
  name: 'ListCommentsByPostedTimeRow',
  fields: [{
    name: 'commentCommentId',
    index: 1,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentSeasonId',
    index: 2,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentEpisodeId',
    index: 3,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentAuthorId',
    index: 4,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentContent',
    index: 5,
    primitiveType: PrimitiveType.STRING,
  }, {
    name: 'commentPinnedTimeMs',
    index: 6,
    primitiveType: PrimitiveType.NUMBER,
  }, {
    name: 'commentPostedTimeMs',
    index: 7,
    primitiveType: PrimitiveType.NUMBER,
  }],
};

export async function listCommentsByPostedTime(
  runner: Database | Transaction,
  args: {
    commentAuthorIdEq?: string,
    commentPostedTimeMsLt?: number,
    limit: number,
  }
): Promise<Array<ListCommentsByPostedTimeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.commentId, Comment.seasonId, Comment.episodeId, Comment.authorId, Comment.content, Comment.pinnedTimeMs, Comment.postedTimeMs FROM Comment WHERE (Comment.authorId = @commentAuthorIdEq AND Comment.postedTimeMs < @commentPostedTimeMsLt) ORDER BY Comment.postedTimeMs DESC LIMIT @limit",
    params: {
      commentAuthorIdEq: args.commentAuthorIdEq == null ? null : args.commentAuthorIdEq,
      commentPostedTimeMsLt: args.commentPostedTimeMsLt == null ? null : Spanner.float(args.commentPostedTimeMsLt),
      limit: args.limit.toString(),
    },
    types: {
      commentAuthorIdEq: { type: "string" },
      commentPostedTimeMsLt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListCommentsByPostedTimeRow>();
  for (let row of rows) {
    resRows.push({
      commentCommentId: row.at(0).value == null ? undefined : row.at(0).value,
      commentSeasonId: row.at(1).value == null ? undefined : row.at(1).value,
      commentEpisodeId: row.at(2).value == null ? undefined : row.at(2).value,
      commentAuthorId: row.at(3).value == null ? undefined : row.at(3).value,
      commentContent: row.at(4).value == null ? undefined : row.at(4).value,
      commentPinnedTimeMs: row.at(5).value == null ? undefined : row.at(5).value.value,
      commentPostedTimeMs: row.at(6).value == null ? undefined : row.at(6).value.value,
    });
  }
  return resRows;
}
