BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(30) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [name] NVARCHAR(200),
    [image] NVARCHAR(1000),
    [role] NVARCHAR(20) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'TEACHER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Post] (
    [id] NVARCHAR(30) NOT NULL,
    [slug] NVARCHAR(200) NOT NULL,
    [title] NVARCHAR(300) NOT NULL,
    [contentHtml] NVARCHAR(max) NOT NULL,
    [excerpt] NVARCHAR(500),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [Post_status_df] DEFAULT 'PENDING',
    [authorType] NVARCHAR(20) NOT NULL,
    [authorUserId] NVARCHAR(30),
    [studentFirstName] NVARCHAR(100),
    [studentLastName] NVARCHAR(100),
    [studentClass] NVARCHAR(50),
    [displayName] NVARCHAR(200),
    [rejectionReason] NVARCHAR(1000),
    [submittedAt] DATETIME2 NOT NULL CONSTRAINT [Post_submittedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [publishedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Post_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Post_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Post_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[PostImage] (
    [id] NVARCHAR(30) NOT NULL,
    [postId] NVARCHAR(30) NOT NULL,
    [blobName] NVARCHAR(500) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [thumbUrl] NVARCHAR(1000),
    [caption] NVARCHAR(500),
    [width] INT,
    [height] INT,
    [sortOrder] INT NOT NULL CONSTRAINT [PostImage_sortOrder_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PostImage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PostImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SiteSettings] (
    [id] INT NOT NULL CONSTRAINT [SiteSettings_id_df] DEFAULT 1,
    [siteTitle] NVARCHAR(200) NOT NULL CONSTRAINT [SiteSettings_siteTitle_df] DEFAULT 'Blog de Limba Română',
    [siteTagline] NVARCHAR(500),
    [aboutHtml] NVARCHAR(max),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SiteSettings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(30) NOT NULL,
    [actorEmail] NVARCHAR(320) NOT NULL,
    [action] NVARCHAR(30) NOT NULL,
    [postId] NVARCHAR(30),
    [postTitle] NVARCHAR(300),
    [details] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Post_status_publishedAt_idx] ON [dbo].[Post]([status], [publishedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Post_status_submittedAt_idx] ON [dbo].[Post]([status], [submittedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PostImage_postId_idx] ON [dbo].[PostImage]([postId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_createdAt_idx] ON [dbo].[AuditLog]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[Post] ADD CONSTRAINT [Post_authorUserId_fkey] FOREIGN KEY ([authorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PostImage] ADD CONSTRAINT [PostImage_postId_fkey] FOREIGN KEY ([postId]) REFERENCES [dbo].[Post]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
