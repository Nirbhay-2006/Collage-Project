using Google.Apis.Auth;

namespace ExamNest.Services
{
    public class GoogleTokenValidator : IGoogleTokenValidator
    {
        private readonly IConfiguration _configuration;

        public GoogleTokenValidator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<GoogleUserInfo?> ValidateAsync(string idToken)
        {
            var audiences = ResolveAllowedAudiences();
            if (audiences.Length == 0)
            {
                throw new InvalidOperationException(
                    "Google OAuth client id is missing. Configure GoogleAuth:ClientId, Authentication:Google:ClientId, or GoogleAuth:AllowedClientIds.");
            }

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = audiences
                });

                return new GoogleUserInfo(
                    payload.Subject,
                    payload.Email,
                    payload.GivenName ?? string.Empty,
                    payload.FamilyName ?? string.Empty,
                    payload.Picture
                );
            }
            catch
            {
                return null;
            }
        }

        private string[] ResolveAllowedAudiences()
        {
            var configuredClientIds = _configuration.GetSection("GoogleAuth:AllowedClientIds").Get<string[]>() ?? Array.Empty<string>();
            var allCandidates = configuredClientIds
                .Append(_configuration["GoogleAuth:ClientId"])
                .Append(_configuration["Authentication:Google:ClientId"])
                .Where(clientId => !string.IsNullOrWhiteSpace(clientId))
                .Select(clientId => clientId!.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            return allCandidates;
        }
    }
}
