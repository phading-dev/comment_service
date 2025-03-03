import "../../../local/env";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import {
  GET_COMMENT_ROW,
  deleteCommentStatement,
  getComment,
} from "../../../db/sql";
import { PostCommentHandler } from "./post_comment_handler";
import { POST_COMMENT_RESPONSE } from "@phading/comment_service_interface/show/web/author/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "PostCommentHandlerTest",
  cases: [
    {
      name: "Success",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new PostCommentHandler(
          SPANNER_DATABASE,
          serviceClientMock,
          () => "comment1",
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            content: "content1",
            pinTimeMs: 60,
          },
          "auth",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              comment: {
                commentId: "comment1",
                authorId: "account1",
                content: "content1",
                pinTimeMs: 60,
              },
            },
            POST_COMMENT_RESPONSE,
          ),
          "response",
        );
        assertThat(
          await getComment(SPANNER_DATABASE, "comment1"),
          isArray([
            eqMessage(
              {
                commentData: {
                  commentId: "comment1",
                  authorId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  content: "content1",
                  postedTimeMs: 1000,
                  pinTimeMs: 60,
                },
              },
              GET_COMMENT_ROW,
            ),
          ]),
          "Comment",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([deleteCommentStatement("comment1")]);
          await transaction.commit();
        });
      },
    },
  ],
});
