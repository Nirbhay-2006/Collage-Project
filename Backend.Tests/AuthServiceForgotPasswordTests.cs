using ExamNest.Data;
using ExamNest.Models;
using ExamNest.Models.DTOs;
using ExamNest.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests;

public class AuthServiceForgotPasswordTests
{
    [Fact]
    public async Task ForgotPassword_To_VerifyOtp_To_ResetPassword_Works_EndToEnd()
    {
        using var context = BuildContext();
        await SeedUserAsync(context, "student@example.com", "OldPassword123!");

        var emailSender = new FakeEmailSender();
        var service = BuildService(context, emailSender);

        var forgot = await service.ForgotPasswordAsync(new ForgotPasswordRequestDto { Email = "student@example.com" });
        Assert.True(forgot.Success);

        var otp = context.EmailOtps.OrderByDescending(x => x.CreatedAt).First();
        var verifyWrong = await service.VerifyForgotPasswordOtpAsync(new VerifyForgotPasswordOtpRequestDto
        {
            Email = "student@example.com",
            Otp = "000000"
        });
        Assert.False(verifyWrong.Success);

        var validOtp = ExtractOtpFromLatestEmail(emailSender);
        var verify = await service.VerifyForgotPasswordOtpAsync(new VerifyForgotPasswordOtpRequestDto
        {
            Email = "student@example.com",
            Otp = validOtp
        });
        Assert.True(verify.Success);

        var reset = await service.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Email = "student@example.com",
            NewPassword = "NewPassword123!"
        });
        Assert.True(reset.Success);

        var loginOld = await service.LoginAsync(new LoginRequestDto
        {
            EmailOrUsername = "student@example.com",
            Password = "OldPassword123!"
        });
        Assert.False(loginOld.Success);

        var loginNew = await service.LoginAsync(new LoginRequestDto
        {
            EmailOrUsername = "student@example.com",
            Password = "NewPassword123!"
        });
        Assert.True(loginNew.Success);
    }

    [Fact]
    public async Task ResetPassword_WithoutOtpVerification_Fails()
    {
        using var context = BuildContext();
        await SeedUserAsync(context, "student2@example.com", "OldPassword123!");

        var service = BuildService(context, new FakeEmailSender());

        var reset = await service.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Email = "student2@example.com",
            NewPassword = "NewPassword123!"
        });

        Assert.False(reset.Success);
        Assert.Contains("Verify forgot password OTP", reset.Message);
    }

    private static AuthService BuildService(AppDbContext context, FakeEmailSender emailSender)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Key"] = "super-secret-key-for-tests-only-1234567890",
                ["JwtSettings:Issuer"] = "test-issuer",
                ["JwtSettings:Audience"] = "test-audience",
                ["JwtSettings:DurationInMinutes"] = "60"
            })
            .Build();

        return new AuthService(context, config, emailSender, new FakeGoogleTokenValidator());
    }

    private static AppDbContext BuildContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task SeedUserAsync(AppDbContext context, string email, string password)
    {
        context.Roles.Add(new Role
        {
            RoleId = 3,
            RoleName = "Student",
            CreatedAt = DateTime.UtcNow
        });

        context.Users.Add(new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            Username = email.Split('@')[0],
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            RoleId = 3,
            IsActive = true,
            FailedLoginAttempts = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
    }

    private static string ExtractOtpFromLatestEmail(FakeEmailSender sender)
    {
        var body = sender.SentEmails.Last().Body;
        var marker = "font-size: 26px;";
        var start = body.IndexOf(marker, StringComparison.Ordinal);
        Assert.True(start >= 0);

        var openTagEnd = body.IndexOf('>', start);
        var closeTag = body.IndexOf("</div>", openTagEnd, StringComparison.Ordinal);
        Assert.True(openTagEnd >= 0 && closeTag > openTagEnd);

        return body.Substring(openTagEnd + 1, closeTag - openTagEnd - 1).Trim();
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public List<(string To, string Subject, string Body)> SentEmails { get; } = [];

        public Task SendEmailAsync(string toEmail, string subject, string body, bool isBodyHtml = false)
        {
            SentEmails.Add((toEmail, subject, body));
            return Task.CompletedTask;
        }
    }

    private sealed class FakeGoogleTokenValidator : IGoogleTokenValidator
    {
        public Task<GoogleUserInfo?> ValidateAsync(string idToken) => Task.FromResult<GoogleUserInfo?>(null);
    }
}
