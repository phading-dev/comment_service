import "../../../local/env";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import {
  deleteCommentStatement,
  getComment,
  insertCommentStatement,
} from "../../../db/sql";
import { DeleteCommentHandler } from "./delete_comment_handler";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { newNotFoundError, newUnauthorizedError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertReject, assertThat, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "DeleteCommentHandlerTest",
  cases: [
    {
      name: "DeleteSuccessfully",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertCommentStatement({
              commentId: "comment1",
              authorId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              postedTimeMs: 1000,
              pinTimeMs: 2000,
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new DeleteCommentHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        await handler.handle("", { commentId: "comment1" }, "auth");

        // Verify
        assertThat(
          await getComment(SPANNER_DATABASE, {commentCommentIdEq:"comment1"}),
          isArray([]),
          "Comment",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([deleteCommentStatement({commentCommentIdEq:"comment1"})]);
          await transaction.commit();
        });
      },
    },
    {
      name: "CommentIsNotFound",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new DeleteCommentHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        let error = await assertReject(
          handler.handle("", { commentId: "comment1" }, "auth"),
        );

        // Verify
        assertThat(
          error,
          eqHttpError(newNotFoundError("Comment comment1 is not found.")),
          "Error",
        );
      },
      async tearDown() {},
    },
    {
      name: "CannotDeleteDueToNotTheAuthor",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertCommentStatement({
              commentId: "comment1",
              authorId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              postedTimeMs: 1000,
              pinTimeMs: 2000,
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account2",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new DeleteCommentHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        // Execute
        let error = await assertReject(
          handler.handle("", { commentId: "comment1" }, "auth"),
        );

        // Verify
        assertThat(
          error,
          eqHttpError(
            newUnauthorizedError(
              "Account account2 is not allowed to delete comment comment1.",
            ),
          ),
          "Error",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([deleteCommentStatement({commentCommentIdEq:"comment1"})]);
          await transaction.commit();
        });
      },
    },
  ],
});
