import "../../../local/env";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import {
  deleteCommentStatement,
  insertCommentStatement,
} from "../../../db/sql";
import { ListCommentsHandler } from "./list_comments_handler";
import { LIST_COMMENTS_RESPONSE } from "@phading/comment_service_interface/show/web/reader/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListCommentsHandlerTest",
  cases: [
    {
      name: "ListARange",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertCommentStatement({
              commentId: "comment1",
              authorId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content1",
              postedTimeMs: 1000,
              pinnedTimeMs: 60,
            }),
            insertCommentStatement({
              commentId: "comment2",
              authorId: "account2",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content2",
              postedTimeMs: 2000,
              pinnedTimeMs: 180,
            }),
            insertCommentStatement({
              commentId: "comment3",
              authorId: "account3",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content3",
              postedTimeMs: 3000,
              pinnedTimeMs: 120,
            }),
            insertCommentStatement({
              commentId: "comment4",
              authorId: "account4",
              seasonId: "season1",
              episodeId: "episode1",
              content: "content4",
              postedTimeMs: 4000,
              pinnedTimeMs: 240,
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
        let handler = new ListCommentsHandler(
          SPANNER_DATABASE,
          serviceClientMock,
        );

        {
          // Execute
          let response = await handler.handle(
            "",
            {
              seasonId: "season1",
              episodeId: "episode1",
              pinnedTimeMsStart: 120,
              pinnedTimeMsEnd: 240,
            },
            "auth",
          );

          // Verify
          assertThat(
            response,
            eqMessage(
              {
                comments: [
                  {
                    commentId: "comment3",
                    authorId: "account3",
                    content: "content3",
                    pinnedTimeMs: 120,
                  },
                  {
                    commentId: "comment2",
                    authorId: "account2",
                    content: "content2",
                    pinnedTimeMs: 180,
                  },
                ],
              },
              LIST_COMMENTS_RESPONSE,
            ),
            "response 1",
          );
        }
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteCommentStatement({ commentCommentIdEq: "comment1" }),
            deleteCommentStatement({ commentCommentIdEq: "comment2" }),
            deleteCommentStatement({ commentCommentIdEq: "comment3" }),
            deleteCommentStatement({ commentCommentIdEq: "comment4" }),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
