import http = require("http");
import { ENV_VARS } from "./env_vars";
import { DeleteCommentHandler } from "./show/web/author/delete_comment_handler";
import { ListPostedCommentsHandler } from "./show/web/author/list_posted_comments_handler";
import { PostCommentHandler } from "./show/web/author/post_comment_handler";
import { ListCommentsHandler } from "./show/web/reader/list_comments_handler";
import { COMMENT_WEB_SERVICE } from "@phading/comment_service_interface/service";
import { ServiceHandler } from "@selfage/service_handler/service_handler";

async function main() {
  let service = ServiceHandler.create(
    http.createServer(),
    ENV_VARS.externalOrigin,
  )
    .addCorsAllowedPreflightHandler()
    .addHealthCheckHandler()
    .addReadinessHandler()
    .addMetricsHandler();
  service
    .addHandlerRegister(COMMENT_WEB_SERVICE)
    .add(DeleteCommentHandler.create())
    .add(ListPostedCommentsHandler.create())
    .add(PostCommentHandler.create())
    .add(ListCommentsHandler.create());
  await service.start(ENV_VARS.port);
}

main();
