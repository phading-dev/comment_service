import { Statement } from '@google-cloud/spanner/build/src/transaction';
import { Spanner, Database, Transaction } from '@google-cloud/spanner';
import { Comment, COMMENT } from './schema';
import { serializeMessage, deserializeMessage } from '@selfage/message/serializer';
import { MessageDescriptor } from '@selfage/message/descriptor';

export function insertCommentStatement(
  data: Comment,
): Statement {
  return insertCommentInternalStatement(
    data.commentId,
    data.seasonId,
    data.episodeId,
    data.authorId,
    data.pinTimeMs,
    data.postedTimeMs,
    data
  );
}

export function insertCommentInternalStatement(
  commentId: string,
  seasonId: string,
  episodeId: string,
  authorId: string,
  pinTimeMs: number,
  postedTimeMs: number,
  data: Comment,
): Statement {
  return {
    sql: "INSERT Comment (commentId, seasonId, episodeId, authorId, pinTimeMs, postedTimeMs, data) VALUES (@commentId, @seasonId, @episodeId, @authorId, @pinTimeMs, @postedTimeMs, @data)",
    params: {
      commentId: commentId,
      seasonId: seasonId,
      episodeId: episodeId,
      authorId: authorId,
      pinTimeMs: Spanner.float(pinTimeMs),
      postedTimeMs: Spanner.float(postedTimeMs),
      data: Buffer.from(serializeMessage(data, COMMENT).buffer),
    },
    types: {
      commentId: { type: "string" },
      seasonId: { type: "string" },
      episodeId: { type: "string" },
      authorId: { type: "string" },
      pinTimeMs: { type: "float64" },
      postedTimeMs: { type: "float64" },
      data: { type: "bytes" },
    }
  };
}

export function deleteCommentStatement(
  commentCommentIdEq: string,
): Statement {
  return {
    sql: "DELETE Comment WHERE (Comment.commentId = @commentCommentIdEq)",
    params: {
      commentCommentIdEq: commentCommentIdEq,
    },
    types: {
      commentCommentIdEq: { type: "string" },
    }
  };
}

export interface GetCommentRow {
  commentData: Comment,
}

export let GET_COMMENT_ROW: MessageDescriptor<GetCommentRow> = {
  name: 'GetCommentRow',
  fields: [{
    name: 'commentData',
    index: 1,
    messageType: COMMENT,
  }],
};

export async function getComment(
  runner: Database | Transaction,
  commentCommentIdEq: string,
): Promise<Array<GetCommentRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.data FROM Comment WHERE (Comment.commentId = @commentCommentIdEq)",
    params: {
      commentCommentIdEq: commentCommentIdEq,
    },
    types: {
      commentCommentIdEq: { type: "string" },
    }
  });
  let resRows = new Array<GetCommentRow>();
  for (let row of rows) {
    resRows.push({
      commentData: deserializeMessage(row.at(0).value, COMMENT),
    });
  }
  return resRows;
}

export function updateCommentStatement(
  data: Comment,
): Statement {
  return updateCommentInternalStatement(
    data.commentId,
    data.seasonId,
    data.episodeId,
    data.authorId,
    data.pinTimeMs,
    data.postedTimeMs,
    data
  );
}

export function updateCommentInternalStatement(
  commentCommentIdEq: string,
  setSeasonId: string,
  setEpisodeId: string,
  setAuthorId: string,
  setPinTimeMs: number,
  setPostedTimeMs: number,
  setData: Comment,
): Statement {
  return {
    sql: "UPDATE Comment SET seasonId = @setSeasonId, episodeId = @setEpisodeId, authorId = @setAuthorId, pinTimeMs = @setPinTimeMs, postedTimeMs = @setPostedTimeMs, data = @setData WHERE (Comment.commentId = @commentCommentIdEq)",
    params: {
      commentCommentIdEq: commentCommentIdEq,
      setSeasonId: setSeasonId,
      setEpisodeId: setEpisodeId,
      setAuthorId: setAuthorId,
      setPinTimeMs: Spanner.float(setPinTimeMs),
      setPostedTimeMs: Spanner.float(setPostedTimeMs),
      setData: Buffer.from(serializeMessage(setData, COMMENT).buffer),
    },
    types: {
      commentCommentIdEq: { type: "string" },
      setSeasonId: { type: "string" },
      setEpisodeId: { type: "string" },
      setAuthorId: { type: "string" },
      setPinTimeMs: { type: "float64" },
      setPostedTimeMs: { type: "float64" },
      setData: { type: "bytes" },
    }
  };
}

export interface ListCommentsInEpisodeRow {
  commentData: Comment,
}

export let LIST_COMMENTS_IN_EPISODE_ROW: MessageDescriptor<ListCommentsInEpisodeRow> = {
  name: 'ListCommentsInEpisodeRow',
  fields: [{
    name: 'commentData',
    index: 1,
    messageType: COMMENT,
  }],
};

export async function listCommentsInEpisode(
  runner: Database | Transaction,
  commentSeasonIdEq: string,
  commentEpisodeIdEq: string,
  commentPinTimeMsGt: number,
  limit: number,
): Promise<Array<ListCommentsInEpisodeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.data FROM Comment WHERE (Comment.seasonId = @commentSeasonIdEq AND Comment.episodeId = @commentEpisodeIdEq AND Comment.pinTimeMs > @commentPinTimeMsGt) ORDER BY Comment.pinTimeMs LIMIT @limit",
    params: {
      commentSeasonIdEq: commentSeasonIdEq,
      commentEpisodeIdEq: commentEpisodeIdEq,
      commentPinTimeMsGt: Spanner.float(commentPinTimeMsGt),
      limit: limit.toString(),
    },
    types: {
      commentSeasonIdEq: { type: "string" },
      commentEpisodeIdEq: { type: "string" },
      commentPinTimeMsGt: { type: "float64" },
      limit: { type: "int64" },
    }
  });
  let resRows = new Array<ListCommentsInEpisodeRow>();
  for (let row of rows) {
    resRows.push({
      commentData: deserializeMessage(row.at(0).value, COMMENT),
    });
  }
  return resRows;
}

export interface ListCommentsByPostedTimeRow {
  commentData: Comment,
}

export let LIST_COMMENTS_BY_POSTED_TIME_ROW: MessageDescriptor<ListCommentsByPostedTimeRow> = {
  name: 'ListCommentsByPostedTimeRow',
  fields: [{
    name: 'commentData',
    index: 1,
    messageType: COMMENT,
  }],
};

export async function listCommentsByPostedTime(
  runner: Database | Transaction,
  commentAuthorIdEq: string,
  commentPostedTimeMsLt: number,
  limit: number,
): Promise<Array<ListCommentsByPostedTimeRow>> {
  let [rows] = await runner.run({
    sql: "SELECT Comment.data FROM Comment WHERE (Comment.authorId = @commentAuthorIdEq AND Comment.postedTimeMs < @commentPostedTimeMsLt) ORDER BY Comment.postedTimeMs DESC LIMIT @limit",
    params: {
      commentAuthorIdEq: commentAuthorIdEq,
      commentPostedTimeMsLt: Spanner.float(commentPostedTimeMsLt),
      limit: limit.toString(),
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
      commentData: deserializeMessage(row.at(0).value, COMMENT),
    });
  }
  return resRows;
}
