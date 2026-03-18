using Google.Apis.Auth;

namespace ExamNest.Services
{
    public class GoogleTokenValidator : IGoogleTokenValidator
    {
        private readonly IGoogleAuthConfiguration _googleAuthConfiguration;

        public GoogleTokenValidator(IGoogleAuthConfiguration googleAuthConfiguration)
        {
            _googleAuthConfiguration = googleAuthConfiguration;
        }

        public async Task<GoogleUserInfo?> ValidateAsync(string idToken)
        {
            var audiences = ResolveAllowedAudiences();
            if (audiences.Length == 0)
            {
                throw new InvalidOperationException(
                    "Google OAuth client id is missing. Configure GoogleAuth:FrontendClientId, GoogleAuth:ClientId, Authentication:Google:ClientId, or GoogleAuth:AllowedClientIds.");
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
            return _googleAuthConfiguration.GetAllowedAudiences();
        }
    }
}
